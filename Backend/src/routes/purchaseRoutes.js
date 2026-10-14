import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createPurchase,
  getPurchases,
  updatePurchase,
  replacePurchaseItem,
  returnPurchaseItem,
} from "../controller/purchaseController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getPurchases);
router.post("/", createPurchase);
router.put("/:id", updatePurchase);

router.put("/:id/replace", replacePurchaseItem);
router.put("/:id/return", returnPurchaseItem);

export default router;
