    const express = require('express');
    const jwt = require('jsonwebtoken');
    const db = require("../config/db")
    const bcrypt = require('bcryptjs');
    const router = express.Router();

    const SECRET_KEY = "your-secret-key";

    router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Wrap db.query in a Promise to use await
    const result = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM user WHERE user_name = ?", [username], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (result.length === 0) {
      return res.status(401).json({ message: "No Result" });
    }

    const user = result[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: user.user_id, username: user.user_name, type: user.user_type },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error });
  }
});


    module.exports = router;