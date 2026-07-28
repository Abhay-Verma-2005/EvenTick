import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  statusCode:400,
  message: { message: "Too many requests, Try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false, 
});

export const authLimiter = rateLimit({
  windowMs: 4 * 60 * 1000, 
  max: 8, 
  statusCode:400,
  message: { message: "Too many attempts, please try again after 4 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
