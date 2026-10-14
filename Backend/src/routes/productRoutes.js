import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getProductFormOptions,
  createProduct,
  createCategory,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addPurchaseItemToStock,
} from "../controller/productController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/form-options", getProductFormOptions);
router.post("/categories", createCategory);
router.post("/from-purchase", addPurchaseItemToStock);

router.get("/", getProducts);
router.post("/", createProduct);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
