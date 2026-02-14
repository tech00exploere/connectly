import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const decoded = jwt.verify(token, jwtSecret);

    // 🔒 Ensure decoded id is a valid ObjectId
    if (!decoded?.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Attach user info to request (single source of truth)
    req.user = {
      _id: decoded.id
    };

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);

    return res.status(401).json({
      message: "Token is invalid or expired"
    });
  }
};

export default auth;
