import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import Groq from "groq-sdk";
import redis from "./config/redisClient.js";
import dotenv from "dotenv";
import aiRouter from "./routes/aiRoute.js";
dotenv.config();

const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(","),
  credentials: true,
}));

app.use("/api/ai", aiRouter);

app.get("/", (req, res) => {
  res.json({ message: "AI Service is Working" });
});


const groqConnect = async () => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await groq.models.list();
    console.log("Groq AI Connected Successfully");
  } 
  catch (err) {
    console.error(" Groq AI Connection Failed:", err.message);
    process.exit(1);
  }
};

const redisConnect = async () => {
  try {
    await redis.ping();
    console.log("Redis Connected Successfully");
  }
  catch (err) {
    console.error("Redis Connection Failed:", err.message);
    process.exit(1);
  }
};

const server=async () => {
  await groqConnect();
  await redisConnect();
  app.listen(PORT, () => {
    console.log(`AI Server : http://localhost:${PORT}`);
  });
};

server();
