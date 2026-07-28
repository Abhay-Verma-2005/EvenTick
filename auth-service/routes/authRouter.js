import express from "express";
import { userAuth, internalAuth } from "../middlewares/authMiddleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { 
  signUpController, 
  patchController, 
  loginController, 
  logOutController, 
  verificationController,
  uploadProfilePicController,
  removeProfilePicController 
} from "../controllers/authController.js";


const authRouter = express.Router();

// SIGN UP
authRouter.post("/signup/:role", authLimiter, signUpController);

// LOGIN
authRouter.post("/login/:role", authLimiter, loginController);

// LOG OUT
authRouter.post("/logout", logOutController);

// UPDATE USER
authRouter.patch("/profile", userAuth ,patchController);

// UPLOAD PP
authRouter.post("/upload-profile-pic", userAuth, uploadProfilePicController);

// REMOVE PP
authRouter.delete("/remove-profile-pic", userAuth, removeProfilePicController);

// GET USER PROFILE 
authRouter.get("/profile", userAuth, (req, res) => {
  const safeUser = {
    _id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    role: req.user.role,
    city: req.user.city,
    dateOfBirth: req.user.dateOfBirth,
    photoUrl: req.user.photoUrl,
  };
  res.json({ success: true, user: safeUser });
});


// VERIFY Inter-service 
authRouter.post("/verify", internalAuth, userAuth, verificationController);

export default authRouter;
