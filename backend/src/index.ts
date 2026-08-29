import dotenv from "dotenv";
dotenv.config();

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

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: "*",
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API Base URL: http://localhost:${PORT}/api`);
});

export default app;
