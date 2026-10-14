import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getMyStore,
  createStore,
  updateMyStore,
  depositToStore,
} from "../controller/storeController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyStore);
router.post("/", createStore);
router.put("/me", updateMyStore);
router.post("/:storeId/deposits", depositToStore);

export default router;
