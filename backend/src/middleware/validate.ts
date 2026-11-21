import { NextFunction, Request, Response } from "express";
import { ZodTypeAny, z } from "zod";

/**
 * req.body'yi verilen zod semasina gore dogrular ve dogrulanmis/temizlenmis
 * degerle degistirir. Eksik zorunlu alanlarda `requiredMessage` donulur;
 * diger hatalarda semadaki ilk hata mesaji kullanilir.
 */
export function validateBody<S extends ZodTypeAny>(schema: S, requiredMessage = "Zorunlu alanlar eksik.") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});
    if (result.success) {
      req.body = result.data;
      next();
      return;
    }
    const issue = result.error.issues[0];
    // Eksik alanda semada ozel mesaj (required_error) yoksa zod'un varsayilan "Required"
    // mesaji yerine endpoint'e ozel requiredMessage donulur.
    const isMissing = issue?.code === "invalid_type" && issue.received === "undefined";
    const message = isMissing && issue.message === "Required" ? requiredMessage : issue?.message ?? "Geçersiz istek.";
    res.status(400).json({ message });
  };
}

export type Body<S extends ZodTypeAny> = z.infer<S>;
