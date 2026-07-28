import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const userAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ authenticated: false, message: "Please Login!" });
    }
  
    const decodedObj = await jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = decodedObj;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    req.user = user;
    req.tokenExp = decodedObj.exp;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ authenticated: false, message: err.message });
  }
};

export const internalAuth = (req, res, next) => {
  const intAccessKey = req.headers["int_access_key"];

  if (!intAccessKey || intAccessKey !== process.env.SERVICE_API_KEY) {
    return res.status(403).json({ 
      success: false, 
      message: "Forbidden: Invalid or missing Internal Access Key" 
    });
  }
  
  next();
};
