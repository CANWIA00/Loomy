import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";

const UNIT_SELECT = { id: true, name: true } as const;

/** Sirketin ekledigi birimler (alfabetik). */
export async function listCustomUnits(req: AuthRequest, res: Response): Promise<void> {
  const companyId = req.user!.companyId!;
  const units = await prisma.customUnit.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    select: UNIT_SELECT,
  });
  res.json(units);
}

/** Birim ekler; ayni isim zaten varsa mevcut kaydi doner. */
export async function createCustomUnit(req: AuthRequest, res: Response): Promise<void> {
  const companyId = req.user!.companyId!;
  const name: string = req.body.name;
  const unit = await prisma.customUnit.upsert({
    where: { companyId_name: { companyId, name } },
    create: { companyId, name },
    update: {},
    select: UNIT_SELECT,
  });
  res.status(201).json(unit);
}

export async function deleteCustomUnit(req: AuthRequest, res: Response): Promise<void> {
  const companyId = req.user!.companyId!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, "Geçersiz birim.");

  const { count } = await prisma.customUnit.deleteMany({ where: { id, companyId } });
  if (count === 0) throw new HttpError(404, "Birim bulunamadı.");
  res.status(204).send();
}
