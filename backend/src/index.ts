import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { backfillAllCompanies } from "./services/monthlySummaries";

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API Base URL: http://localhost:${PORT}/api`);
  backfillAllCompanies();
});
