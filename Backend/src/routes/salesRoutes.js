import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  replaceSale,
  returnSale,
} from "../controller/salesController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getSales);

// Add this route so the Edit page can load one sale.
router.get("/:id", getSaleById);

router.post("/", createSale);
router.put("/:id", updateSale);
router.put("/:id/replace", replaceSale);
router.put("/:id/return", returnSale);

export default router;
