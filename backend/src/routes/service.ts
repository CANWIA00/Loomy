import { Router } from "express";
import {
  getServiceRecords,
  searchServiceRecords,
  getServiceRecordById,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
} from "../controllers/serviceController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/search", authenticate, searchServiceRecords);
router.get("/", authenticate, getServiceRecords);
router.get("/:id", authenticate, getServiceRecordById);
router.post("/", authenticate, createServiceRecord);
router.put("/:id", authenticate, updateServiceRecord);
router.delete("/:id", authenticate, isAdmin, deleteServiceRecord);

export default router;
