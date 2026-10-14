import express from "express";
import {
  createExpense,
  getExpenses,
  deleteExpense,
} from "../controller/expensesController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createExpense);
router.get("/", authMiddleware, getExpenses);
router.delete("/:id", authMiddleware, deleteExpense);

export default router;
