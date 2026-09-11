import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { parseEInvoiceXml } from "../utils/parseEInvoiceXml";
import { mergeStockEntry } from "../utils/stockPricing";

const REASON_INITIAL = "INITIAL";
const REASON_MANUAL = "MANUAL";
const REASON_INVOICE = "INVOICE";

export async function listStockItems(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = _req.user!.companyId!;
    const q = String((_req.query.q as string) || "").trim();

    const items = await prisma.stockItem.findMany({
      where: {
        companyId,
        ...(q
          ? {
              name: { contains: q, mode: "insensitive" as const },
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    const content = items.map((item) => ({
      ...item,
      lowStock: item.quantity <= item.minQuantity,
    }));

    res.json({ content, totalElements: content.length });
  } catch (error: any) {
    console.error("ListStockItems error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function getStockItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const companyId = req.user!.companyId!;

    const item = await prisma.stockItem.findFirst({
      where: { id, companyId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            invoice: { select: { id: true, invoiceNo: true, date: true } },
          },
        },
      },
    });

    if (!item) {
      res.status(404).json({ message: "Stok ürünü bulunamadı." });
      return;
    }

    res.json(item);
  } catch (error: any) {
    console.error("GetStockItem error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function createStockItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const {
      name,
      unit,
      quantity,
      minQuantity,
      unitPrice,
      currency,
      vatRate,
      supplierName,
      supplierTaxNumber,
      notes,
    } = req.body;

    const itemName = String(name || "").trim();
    if (!itemName) {
      res.status(400).json({ message: "Ürün adı zorunludur." });
      return;
    }

    const initialQty = Number(quantity) || 0;
    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.create({
        data: {
          name: itemName,
          unit: unit?.trim() || "AD",
          quantity: initialQty,
          minQuantity: Number(minQuantity) || 0,
          unitPrice: unitPrice != null && unitPrice !== "" ? Number(unitPrice) : null,
          currency: currency?.trim() || "TRY",
          vatRate: Number(vatRate) || 0,
          supplierName: supplierName?.trim() || null,
          supplierTaxNumber: supplierTaxNumber?.trim() || null,
          notes: notes?.trim() || null,
          companyId,
        },
      });

      if (initialQty > 0) {
        await tx.stockTransaction.create({
          data: {
            stockItemId: item.id,
            change: initialQty,
            reason: REASON_INITIAL,
            unitPrice: item.unitPrice,
            currency: item.currency,
            vatRate: item.vatRate || null,
            vatAmount: item.unitPrice != null ? Math.round(item.unitPrice * initialQty * (item.vatRate || 0)) / 100 : null,
            companyId,
          },
        });
      }

      return item;
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error("CreateStockItem error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateStockItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const companyId = req.user!.companyId!;
    const data = req.body;

    const existing = await prisma.stockItem.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Stok ürünü bulunamadı." });
      return;
    }

    const patch: Record<string, unknown> = {
      name: data.name?.trim() || existing.name,
      unit: data.unit?.trim() || existing.unit,
      minQuantity:
        data.minQuantity != null && data.minQuantity !== "" ? Number(data.minQuantity) : existing.minQuantity,
      unitPrice:
        data.unitPrice != null && data.unitPrice !== ""
          ? Number(data.unitPrice)
          : existing.unitPrice,
      currency: data.currency?.trim() || existing.currency,
      vatRate: data.vatRate != null ? Number(data.vatRate) : existing.vatRate,
      supplierName: data.supplierName?.trim() ?? existing.supplierName,
      supplierTaxNumber: data.supplierTaxNumber?.trim() ?? existing.supplierTaxNumber,
      notes: data.notes?.trim() ?? existing.notes,
      lowStockAlert: data.lowStockAlert != null ? Boolean(data.lowStockAlert) : existing.lowStockAlert,
    };

    const updated = await prisma.stockItem.update({ where: { id }, data: patch });
    res.json(updated);
  } catch (error: any) {
    console.error("UpdateStockItem error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteStockItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const companyId = req.user!.companyId!;

    const existing = await prisma.stockItem.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Stok ürünü bulunamadı." });
      return;
    }

    await prisma.stockItem.delete({ where: { id } });
    res.json({ message: "Stok ürünü silindi." });
  } catch (error: any) {
    console.error("DeleteStockItem error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function addStockTransaction(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const companyId = req.user!.companyId!;
    const { change, note, unitPrice, currency } = req.body;

    const existing = await prisma.stockItem.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Stok ürünü bulunamadı." });
      return;
    }

    const delta = Number(change);
    if (!Number.isFinite(delta) || delta === 0) {
      res.status(400).json({ message: "Geçerli bir miktar girin." });
      return;
    }

    const pricePatch: Record<string, unknown> = {};
    const incomingPrice = unitPrice != null && unitPrice !== "" ? Number(unitPrice) : null;
    let mergedVat: number | null = existing.vatRate || null;
    if (incomingPrice != null) {
      const merged = mergeStockEntry(
        { unitPrice: existing.unitPrice, vatRate: existing.vatRate },
        { unitPrice: incomingPrice }
      );
      pricePatch.unitPrice = merged.unitPrice;
      pricePatch.vatRate = merged.vatRate;
      mergedVat = merged.vatRate || null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.update({
        where: { id },
        data: {
          quantity: Math.max(0, existing.quantity + delta),
          ...pricePatch,
        },
      });
      await tx.stockTransaction.create({
        data: {
          stockItemId: id,
          change: delta,
          reason: REASON_MANUAL,
          unitPrice: incomingPrice,
          currency: currency?.trim() || existing.currency,
          vatRate: mergedVat,
          vatAmount:
            incomingPrice != null ?
              Math.round(incomingPrice * Math.abs(delta) * (existing.vatRate || 0)) / 100 :
              null,
          note: note?.trim() || null,
          companyId,
        },
      });
      return item;
    });

    res.json(updated);
  } catch (error: any) {
    console.error("AddStockTransaction error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function listInvoices(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 20;
    const companyId = req.user!.companyId!;

    const [content, totalElements] = await Promise.all([
      prisma.invoice.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        skip: page * size,
        take: size,
        include: {
          lines: {
            include: {
              stockItem: { select: { id: true, name: true, quantity: true, unit: true } },
            },
          },
        },
      }),
      prisma.invoice.count({ where: { companyId } }),
    ]);

    res.json({
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      number: page,
      size,
    });
  } catch (error: any) {
    console.error("ListInvoices error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function importInvoiceXml(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const xml = String(req.body?.xml || "");
    const dryRun = Boolean(req.body?.dryRun);
    const rawName = req.body?.fileName ? String(req.body.fileName) : null;

    if (!xml.trim()) {
      res.status(400).json({ message: "XML içeriği zorunludur." });
      return;
    }

    let parsed;
    try {
      parsed = parseEInvoiceXml(xml);
    } catch (error: any) {
      res.status(400).json({ message: "Geçersiz e-fatura XML'i: " + error.message });
      return;
    }

    if (!parsed.lines.length) {
      res.status(400).json({ message: "Faturada ürün satırı bulunamadı." });
      return;
    }

    const existing = await prisma.invoice.findUnique({
      where: {
        companyId_invoiceNo: { companyId, invoiceNo: parsed.invoiceNo },
      },
    });

    if (existing) {
      res.status(409).json({
        message: `"${parsed.invoiceNo}" numaralı fatura daha önce yüklenmiş.`,
      });
      return;
    }

    if (dryRun) {
      res.json({ invoice: parsed });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo: parsed.invoiceNo,
          invoiceType: parsed.invoiceType,
          date: parsed.date,
          supplierName: parsed.supplierName,
          supplierTaxNumber: parsed.supplierTaxNumber,
          supplierAddress: parsed.supplierAddress,
          totalAmount: parsed.totalAmount,
          currency: parsed.currency,
          vatAmount: parsed.vatAmount,
          rawName,
          companyId,
        },
      });

      let created = 0;
      let updated = 0;

      for (const line of parsed.lines) {
        let stockItem = await tx.stockItem.findFirst({
          where: {
            companyId,
            name: { equals: line.name, mode: "insensitive" as const },
          },
        });

        if (stockItem) {
          const merged = mergeStockEntry(
            { unitPrice: stockItem.unitPrice, vatRate: stockItem.vatRate, unit: stockItem.unit },
            { unitPrice: line.unitPrice, vatRate: line.vatRate, unit: line.unit }
          );
          stockItem = await tx.stockItem.update({
            where: { id: stockItem.id },
            data: {
              quantity: { increment: line.quantity },
              unit: merged.unit,
              unitPrice: merged.unitPrice,
              currency: parsed.currency || stockItem.currency,
              vatRate: merged.vatRate,
              supplierName: parsed.supplierName ?? stockItem.supplierName,
              supplierTaxNumber: parsed.supplierTaxNumber ?? stockItem.supplierTaxNumber,
              lastInvoiceNo: parsed.invoiceNo,
              lastInvoiceDate: parsed.date,
            },
          });
          updated++;
        } else {
          stockItem = await tx.stockItem.create({
            data: {
              name: line.name,
              unit: line.unit,
              quantity: line.quantity,
              minQuantity: 0,
              unitPrice: line.unitPrice || null,
              currency: parsed.currency,
              vatRate: line.vatRate || 0,
              supplierName: parsed.supplierName,
              supplierTaxNumber: parsed.supplierTaxNumber,
              lastInvoiceNo: parsed.invoiceNo,
              lastInvoiceDate: parsed.date,
              companyId,
            },
          });
          created++;
        }

        await tx.invoiceLine.create({
          data: {
            invoiceId: invoice.id,
            name: line.name,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice || null,
            lineAmount: line.lineAmount,
            vatRate: line.vatRate || 0,
            stockItemId: stockItem.id,
            companyId,
          },
        });

        await tx.stockTransaction.create({
          data: {
            stockItemId: stockItem.id,
            change: line.quantity,
            reason: REASON_INVOICE,
            unitPrice: line.unitPrice || null,
            currency: parsed.currency,
            vatRate: line.vatRate || null,
            vatAmount: line.lineAmount != null ? Math.round(line.lineAmount * (line.vatRate || 0)) / 100 : null,
            invoiceId: invoice.id,
            note: parsed.invoiceNo,
            companyId,
          },
        });
      }

      return {
        invoice: {
          id: invoice.id,
          invoiceNo: invoice.invoiceNo,
          date: invoice.date,
          supplierName: invoice.supplierName,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
        },
        created,
        updated,
        totalLines: parsed.lines.length,
      };
    });

    res.status(201).json({ message: "Fatura başarıyla içe aktarıldı.", ...result });
  } catch (error: any) {
    console.error("ImportInvoiceXml error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteInvoice(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const companyId = req.user!.companyId!;
    const revertStock = String(req.query?.revertStock ?? "true").toLowerCase() !== "false";

    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        transactions: { select: { id: true, stockItemId: true, change: true } },
      },
    });

    if (!invoice) {
      res.status(404).json({ message: "Fatura bulunamadı." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (revertStock) {
        for (const tr of invoice.transactions) {
          await tx.stockItem.update({
            where: { id: tr.stockItemId },
            data: { quantity: { decrement: tr.change } },
          });
        }
      }
      await tx.invoice.delete({ where: { id } });
    });

    res.json({
      message: revertStock
        ? "Fatura silindi ve stok miktarları geri alındı."
        : "Fatura silindi. Stok miktarları değiştirilmedi.",
    });
  } catch (error: any) {
    console.error("DeleteInvoice error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}