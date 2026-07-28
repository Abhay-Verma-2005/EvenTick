import bcrypt from "bcrypt";
import User from "../models/User.js";
import { validateSignUpData, ValidatePatch } from "../utils/validation.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import redis from "../config/redisClient.js";

const invalidateTokenCache = async (token) => {
  if (!token) return;
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  await redis.del(`session:${hash}`);
};

// Sign Up
export const signUpController = async (req, res) => {
  try {
    // Validate data
    await validateSignUpData(req);
    const { firstName, lastName, email, dateOfBirth, password } = req.body;
    const { role } = req.params;

    // Encrypt password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      dateOfBirth,
      password: passwordHash,
      role,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
    });

    res.json({ message: "User added successfully!", token, data: savedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Login
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { role } = req.params;

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Email is not registered");
    }

    if (user.role.toLowerCase() !== role.toLowerCase()) {
      throw new Error(`Access denied. Please login through the ${user.role.toUpperCase()} portal.`);
    }

    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.getJWT();
      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      });
      res.json({ message: "User login Successfully", token, data: user });

    } else { 
      throw new Error("Incorrect password");
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Logout
export const logOutController = async (req, res) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  await invalidateTokenCache(token);

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Logout Successful!!" });
};
  

// Update 
export const patchController = async (req, res) => {
  try {
    const update = req.body;

    // Validate Data
    ValidatePatch(req);

    const userId = req.user._id;
    let shouldInvalidate = false;

    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
      shouldInvalidate = true;
    }
    
    if (update.role) {
      shouldInvalidate = true;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      returnDocument: "after",
      runValidators: true,
    });

    if (shouldInvalidate && req.token) {
      await invalidateTokenCache(req.token);
    }

    res.json({ message: "User profile updated successfully!", data: updatedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Get Profile
export const getProfileController = async (req, res) => {
  try {
    const user = req.user;
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// AI Verification (Inter-service)
export const verificationController = async (req, res) => {
  res.json({ 
    success: true,
    authenticated: true,
    message: "Token is valid", 
    user: { 
      _id: req.user._id, 
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      city: req.user.city,
    },
    exp: req.tokenExp
  });
};

// Upload Profile Picture
export const uploadProfilePicController = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "Image data is required" });
    
    const result = await cloudinary.uploader.upload(image, { folder: "eventick_user_profiles" });
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { photoUrl: result.secure_url }, 
      { new: true, runValidators: true }
    );
    
    res.json({ message: "Profile picture updated successfully", data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Remove Profile Picture
export const removeProfilePicController = async (req, res) => {
  try {
    const defaultPhoto = "https://geographyandyou.com/images/user-profile.png";
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { photoUrl: defaultPhoto }, 
      { new: true, runValidators: true }
    );
    
    res.json({ message: "Profile picture removed", data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};