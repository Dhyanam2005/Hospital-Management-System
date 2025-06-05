const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require("../config/db");

function authenticateJWT(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.log("No Authorization header found");
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log("Authorization header malformed - no token part");
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  jwt.verify(token, "your-secret-key", (err, user) => {
    if (err) {
      console.log("JWT verification failed:", err.message);
      return res.status(403).json({ message: 'Access Denied: Invalid token' });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateJWT };
