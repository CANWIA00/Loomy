import express from "express";
import cors from "cors";
import compression from "compression";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import customerRoutes from "./routes/customer";
import serviceRoutes from "./routes/service";
import quoteRoutes from "./routes/quote";
import serviceTemplateRoutes from "./routes/serviceTemplate";
import paymentRoutes from "./routes/payment";
import teamRoutes from "./routes/team";
import companyRoutes from "./routes/company";
import appointmentRoutes from "./routes/appointment";
import stockRoutes from "./routes/stock";
import financeRoutes from "./routes/finance";
import devRoutes from "./routes/dev";
import translateRoutes from "./routes/translate";
import currencyRatesRoutes from "./routes/currencyRates";
import applyRoutes from "./routes/apply";
import unitRoutes from "./routes/unit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [
        "https://app.loomy-app.com",
        "https://loomy-omega.vercel.app",
        "https://loomy-app.com",
        "https://www.loomy-app.com",
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:5173",
      ]
).filter(Boolean);

function toOriginPattern(allowed: string): RegExp {
  const escaped = allowed.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + escaped.replace(/\*/g, "[^/]+") + "$");
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some((allowed) =>
    allowed.includes("*") ? toOriginPattern(allowed).test(origin) : allowed === origin
  );
}

const app = express();

// Railway gibi tek bir reverse proxy arkasinda calisiyoruz; req.ip bu sayede
// gercek istemci IP'sini verir ve x-forwarded-for sahteciligine kapali olur.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));

app.use(compression());

app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
}));

// Giris gerektirmeyen endpointler yalnizca kucuk JSON alir; boylece anonim
// istemciler 15mb'lik govdelerle sunucuyu yoramaz. Ilk eslesen parser govdeyi
// okur, sonraki parser zaten okunmus govdeyi atlar.
app.use(["/api/auth", "/api/apply", "/api/translate"], express.json({ limit: "100kb" }));
// Imza, logo ve kase base64 olarak geldigi icin giris yapilmis istekler buyuk olabilir.
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/service-templates", serviceTemplateRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/dev", devRoutes);
app.use("/api", translateRoutes);
app.use("/api/rates", currencyRatesRoutes);
app.use("/api/apply", applyRoutes);
app.use("/api/units", unitRoutes);

app.use("/api", notFoundHandler);
app.use(errorHandler);

export default app;
