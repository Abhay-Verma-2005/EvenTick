import crypto from "crypto";
import redis from "../config/redisClient.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie;
    let tokenStr = null;
    let bearerToken = null;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      bearerToken = req.headers.authorization;
      tokenStr = bearerToken.split(" ")[1];
    } else if (cookie) {
      const tokenMatch = cookie.match(/token=([^;]+)/);
      if (tokenMatch) tokenStr = tokenMatch[1];
    }

    if (!tokenStr) {
      return res.status(401).json({ authenticated: false, message: "Please Login!" });
    }

    const tokenHash = crypto.createHash("sha256").update(tokenStr).digest("hex");
    const cacheKey = `session:${tokenHash}`;

    // 1. Check Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const user = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      req.userId = user._id;
      return next();
    }

    // 2. Cache Miss - Call Auth Service
    const expectedKey = process.env.SERVICE_API_KEY;
    const authUrl = process.env.AUTH_SERVICE_URL;

    const forwardHeaders = {
      "INT_ACCESS_KEY": expectedKey,
      "Content-Type": "application/json",
    };
    
    if (cookie) forwardHeaders["Cookie"] = cookie;
    if (bearerToken) forwardHeaders["Authorization"] = bearerToken;

    const response = await fetch(`${authUrl}/api/verify`, {
      method: "POST",
      headers: forwardHeaders,
    });

    const data = await response.json();

    if (!response.ok || !data.authenticated || !data.success) {
      return res.status(401).json({ authenticated: false, message: "Not authenticated" });
    }

    const user = data.user || data.data;
    req.userId = user._id;

    // 3. Save to Redis
    const exp = data.exp;
    let ttl = 15 * 60; // Default 15 minutes
    if (exp) {
      const currentSeconds = Math.floor(Date.now() / 1000);
      const remainingTTL = exp - currentSeconds;
      ttl = Math.min(ttl, remainingTTL);
    }
    
    if (ttl > 0) {
      await redis.setex(cacheKey, ttl, JSON.stringify(user));
    }

    next();
  } catch (err) {
    res.status(401).json({ authenticated: false, message: err.message });
  }
};
