import { Router } from "express";
import { authenticate, isAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validate";
import { createUnitSchema } from "../schemas/unit";
import { listCustomUnits, createCustomUnit, deleteCustomUnit } from "../controllers/unitController";

const router = Router();

// Birimler teklif, servis ve stokta ortak; sirketin her kullanicisi gorup ekleyebilir.
router.get("/", authenticate, asyncHandler(listCustomUnits));
router.post("/", authenticate, validateBody(createUnitSchema, "Birim adı zorunludur."), asyncHandler(createCustomUnit));
router.delete("/:id", authenticate, isAdmin, asyncHandler(deleteCustomUnit));

export default router;
