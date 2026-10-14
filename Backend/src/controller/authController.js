import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req, res) => {
  try {
    // getting the data form the body
    const { name, email, password, confirm_password } = req.body;

    const nameRegex = /^[\p{L}\s]+$/u;

    //validation to check if the data is valid

    if (!name || !email || !password || !confirm_password) {
      return res
        .status(400)
        .json("something is missing! please fill all the fields");
    }

    //remove the extra spaces
    const cleanName = name.trim();

    //check if the name is valid
    if (!nameRegex.test(cleanName)) {
      return res.status(400).json("invalid name");
    }

    //check if the email is valid
    if (!email.includes("@")) {
      return res.status(400).json("invalid email");
    }

    //check if the password is valid or its length is greater than 8 characters
    if (password.length < 8) {
      return res
        .status(400)
        .json("password must be at least 8 characters long");
    }

    //check whethere the passwords match
    if (password !== confirm_password) {
      return res.status(400).json("passwords do not match");
    }

    //check if the user already exists
    const existsUser = await prisma.members.findUnique({
      where: {
        email: email,
      },
    });

    if (existsUser) {
      return res.status(400).json("user already exists");
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    //create the user in database
    const user = await prisma.members.create({
      data: {
        name: cleanName,
        email: email.trim().toLowerCase(),
        password: hashedpassword,
      },
    });

    //add jwt token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    //add jwt to the cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res
        .status(400)
        .json("Something is missing! Please fill all the fields");
    }

    // Clean email
    const cleanEmail = email.trim().toLowerCase();

    // Basic email validation
    if (!cleanEmail.includes("@")) {
      return res.status(400).json("Invalid email");
    }

    // Find user
    const user = await prisma.members.findUnique({
      where: {
        email: cleanEmail,
      },
    });

    // User doesn't exist
    if (!user) {
      return res.status(400).json("Invalid email or password");
    }

    // Compare password
    const isMatching = await bcrypt.compare(password, user.password);

    if (!isMatching) {
      return res.status(400).json("Invalid email or password");
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Store JWT in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Successful response
    return res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.members.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate the required fields
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || null;

    // Basic email validation
    if (!cleanEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // Check whether another member already uses this email
    const existingUser = await prisma.members.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(409).json({
        success: false,
        message: "This email is already in use",
      });
    }

    // Check whether another member already uses this phone
    if (cleanPhone) {
      const existingPhone = await prisma.members.findUnique({
        where: { phone: cleanPhone },
      });

      if (existingPhone && existingPhone.id !== req.user.id) {
        return res.status(409).json({
          success: false,
          message: "This phone number is already in use",
        });
      }
    }

    // Update the currently signed-in member
    const updatedUser = await prisma.members.update({
      where: { id: req.user.id },
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update profile",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please complete all password fields.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "Your new password must differ from your current password.",
      });
    }

    const user = await prisma.members.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Your current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.members.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not change your password. Please try again.",
    });
  }
};

export const googleSignup = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Google authentication is not configured on the server.",
      });
    }

    // Verify the Google ID token on the backend.
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || !payload.email_verified) {
      return res.status(401).json({
        success: false,
        message: "Google could not verify this account's email.",
      });
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name?.trim() || email.split("@")[0];

    // Find an existing account or create a new one.
    let user = await prisma.members.findUnique({
      where: { email },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        12,
      );

      user = await prisma.members.create({
        data: {
          name,
          email,
          password: hashedPassword,
          is_verified: true,
        },
      });
    }

    // Use the same JWT payload expected by your auth middleware.
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Google account authenticated successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Successfully logged out",
  });
};
