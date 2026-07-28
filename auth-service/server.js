import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRouter.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import cors from "cors";

dotenv.config();

const PORT = process.env.PORT;
const app = express();
// Security Load 
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());


app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
);


app.use("/api/", authRouter , apiLimiter);

app.get("/api", (req, res) => {
  res.json({ message: "Authenticqation Service is Working" });
});


connectDB()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`auth Server : http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
});
