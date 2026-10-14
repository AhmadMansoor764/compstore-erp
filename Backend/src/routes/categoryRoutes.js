import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getCategories,
  createCategory,
} from "../controller/categoryController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCategories);
router.post("/", createCategory);

export default router;
