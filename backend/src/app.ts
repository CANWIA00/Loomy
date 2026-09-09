import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import customerRoutes from "./routes/customer";
import serviceRoutes from "./routes/service";
import quoteRoutes from "./routes/quote";
import serviceTemplateRoutes from "./routes/serviceTemplate";
import paymentRoutes from "./routes/payment";
import teamRoutes from "./routes/team";
import appointmentRoutes from "./routes/appointment";
import devRoutes from "./routes/dev";
import translateRoutes from "./routes/translate";
import currencyRatesRoutes from "./routes/currencyRates";
import applyRoutes from "./routes/apply";

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

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
}));

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
app.use("/api/appointments", appointmentRoutes);
app.use("/api/dev", devRoutes);
app.use("/api", translateRoutes);
app.use("/api/rates", currencyRatesRoutes);
app.use("/api/apply", applyRoutes);

export default app;
