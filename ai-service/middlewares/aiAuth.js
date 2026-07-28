import crypto from "crypto";
import redis from "../config/redisClient.js";

export const verifyUser = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie;
    const bearerToken = req.headers.authorization?.startsWith("Bearer ") 
    ? req.headers.authorization : null;

    if (!cookie && !bearerToken) {
      return res.status(401).json({ message: "Please Login" });
    }

    let tokenStr = null;
    if (bearerToken) {
      tokenStr = bearerToken.split(" ")[1];
    } else if (cookie) {
      const tokenMatch = cookie.match(/token=([^;]+)/);
      if (tokenMatch) tokenStr = tokenMatch[1];
    }

    if (!tokenStr) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const tokenHash = crypto.createHash("sha256").update(tokenStr).digest("hex");
    const cacheKey = `session:${tokenHash}`;

    // 1. Check Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      req.user = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
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
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = data.user || data.data;
    req.user = user;

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
    res.status(500).json({ message: err.message });
  }
};