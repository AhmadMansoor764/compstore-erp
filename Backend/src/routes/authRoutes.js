import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  register,
  login,
  getMe,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  googleSignup,
} from "../controller/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);
router.post("/google", googleSignup);
router.post("/logout", logout);

export default router;
