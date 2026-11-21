import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  devLogin,
  getStats,
  listAdminKeys,
  createAdminKey,
  updateAdminKey,
  deleteAdminKey,
  listUsers,
  updateUser,
  deleteUser,
  listCompanies,
  getCompany,
  updateCompany,
} from "../controllers/devController";
import { devAuth } from "../middleware/devAuth";

const router = Router();

router.post("/login", asyncHandler(devLogin));

router.use(devAuth);

router.get("/stats", asyncHandler(getStats));
router.get("/admin-keys", asyncHandler(listAdminKeys));
router.post("/admin-keys", asyncHandler(createAdminKey));
router.put("/admin-keys/:id", asyncHandler(updateAdminKey));
router.delete("/admin-keys/:id", asyncHandler(deleteAdminKey));
router.get("/users", asyncHandler(listUsers));
router.put("/users/:id", asyncHandler(updateUser));
router.delete("/users/:id", asyncHandler(deleteUser));
router.get("/companies", asyncHandler(listCompanies));
router.get("/companies/:id", asyncHandler(getCompany));
router.put("/companies/:id", asyncHandler(updateCompany));

export default router;
