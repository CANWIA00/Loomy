import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";

/**
 * Controller'larda bilincli olarak donulen hatalar icin. Mesaj kullaniciya
 * gosterilir; diger tum hatalar genel bir 500 mesajina donusturulur.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly extra?: Record<string, unknown>
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Async handler'lardaki hatalari Express'in error middleware'ine iletir;
 * boylece her controller'da try/catch tekrarina gerek kalmaz.
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
}

export const GENERIC_SERVER_ERROR = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: "İstenen kaynak bulunamadı." });
}

// Express error middleware'i 4 parametreyle tanimlanmali.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (res.headersSent) {
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, ...err.extra });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ message: err.issues[0]?.message ?? "Geçersiz istek." });
    return;
  }

  // body-parser hatalari: bozuk JSON, cok buyuk govde vb.
  const bodyErr = err as { type?: string; status?: number };
  if (bodyErr?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Geçersiz JSON gövdesi." });
    return;
  }
  if (bodyErr?.type === "entity.too.large") {
    res.status(413).json({ message: "İstek gövdesi çok büyük." });
    return;
  }

  if (err instanceof Error && err.message === "Origin not allowed by CORS") {
    res.status(403).json({ message: "Bu kaynaktan erişime izin verilmiyor." });
    return;
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({ message: GENERIC_SERVER_ERROR });
}
