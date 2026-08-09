import { Router } from "express";
import {
  getServiceRecords,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
} from "../controllers/serviceController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getServiceRecords);
router.post("/", authenticate, createServiceRecord);
router.put("/:id", authenticate, updateServiceRecord);
router.delete("/:id", authenticate, isAdmin, deleteServiceRecord);

export default router;
