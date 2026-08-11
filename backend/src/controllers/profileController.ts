import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Jimp } from "jimp";
import ImageTracer from "imagetracerjs";

async function imageToSvgDataUri(dataUri: string): Promise<string> {
  try {
    const base64 = dataUri.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    const image = await Jimp.read(buffer);

    const maxSize = 600;
    if (image.bitmap.width > maxSize || image.bitmap.height > maxSize) {
      if (image.bitmap.width >= image.bitmap.height) {
        image.resize({ w: maxSize });
      } else {
        image.resize({ h: maxSize });
      }
    }

    image.scan((_x, _y, idx) => {
      const { data } = image.bitmap;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r >= 235 && g >= 235 && b >= 235) {
        data[idx + 3] = 0;
        return;
      }
      const darken = (v: number) => Math.max(0, Math.min(255, Math.round((v - 128) * 1.4 + 128)));
      data[idx] = darken(r);
      data[idx + 1] = darken(g);
      data[idx + 2] = darken(b);
    });

    const imagedata = {
      width: image.bitmap.width,
      height: image.bitmap.height,
      data: Uint8Array.from(image.bitmap.data),
    };
    const svg = ImageTracer.imagedataToSVG(imagedata, {
      pathomit: 4,
      numberofcolors: 8,
      colorquantcycles: 3,
    });

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  } catch (error) {
    console.error("imageToSvgDataUri error:", error);
    return dataUri;
  }
}

async function toSvgDataUri(url?: string): Promise<string | undefined> {
  if (url && url.startsWith("data:image") && !url.startsWith("data:image/svg")) {
    return imageToSvgDataUri(url);
  }
  return url;
}

export async function getProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
        signature: true,
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            taxNumber: true,
            invitationCode: true,
            logoUrl: true,
            stampUrl: true,
            profileCompleted: true,
            _count: { select: { users: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "Kullanıcı bulunamadı." });
      return;
    }

    const company = user.company
      ? {
          ...user.company,
          userCount: user.company._count.users,
          _count: undefined,
        }
      : null;

    res.json({ user, company });
  } catch (error: any) {
    console.error("GetProfile error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, phone, signature } = req.body;

    if (!name || !phone) {
      res.status(400).json({ message: "İsim ve telefon zorunludur." });
      return;
    }

    const existingPhone = await prisma.user.findFirst({
      where: { phone, id: { not: req.user!.id } },
    });

    if (existingPhone) {
      res.status(400).json({ message: "Bu telefon numarası zaten kullanılıyor." });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, phone, signature: signature ?? undefined },
      select: { id: true, name: true, email: true, phone: true, role: true, signature: true },
    });

    res.json(user);
  } catch (error: any) {
    console.error("UpdateUser error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateCompany(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, address, phone, email, taxNumber, logoUrl, stampUrl } = req.body;

    if (!name) {
      res.status(400).json({ message: "Şirket adı zorunludur." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(404).json({ message: "Şirket bulunamadı." });
      return;
    }

    const processedLogoUrl = await toSvgDataUri(logoUrl);
    const processedStampUrl = await toSvgDataUri(stampUrl);

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        name,
        address,
        phone,
        email,
        taxNumber,
        logoUrl: processedLogoUrl,
        stampUrl: processedStampUrl,
        profileCompleted: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        taxNumber: true,
        invitationCode: true,
        logoUrl: true,
        stampUrl: true,
        profileCompleted: true,
      },
    });

    res.json(company);
  } catch (error: any) {
    console.error("UpdateCompany error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}
