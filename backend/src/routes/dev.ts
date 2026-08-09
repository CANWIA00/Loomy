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

router.post("/login", devLogin);

router.use(devAuth);

router.get("/stats", getStats);
router.get("/admin-keys", listAdminKeys);
router.post("/admin-keys", createAdminKey);
router.put("/admin-keys/:id", updateAdminKey);
router.delete("/admin-keys/:id", deleteAdminKey);
router.get("/users", listUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/companies", listCompanies);
router.get("/companies/:id", getCompany);
router.put("/companies/:id", updateCompany);

export default router;
