import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
} from "../controller/supplierController.js";

const router = express.Router();

// All supplier routes require authentication.
router.use(authMiddleware);

router.post("/", createSupplier);
router.get("/", getSuppliers);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
