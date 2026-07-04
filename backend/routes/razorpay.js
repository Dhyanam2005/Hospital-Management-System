const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();
const { authenticateJWT } = require('./authenticateJWT');

function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    throw new Error("Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET in your .env file.");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });
}
router.post("/create-order", authenticateJWT, async (req, res) => {
  const { amount, regId } = req.body;

  try {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `receipt_${regId}_${Date.now()}`
    });

    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create Razorpay order");
  }
});

router.post("/verify", authenticateJWT, async (req,res) => {
    const { razorpay_payment_id } = req.body;
    try{
        const instance = getRazorpayInstance();
        const payment = await instance.payments.fetch(razorpay_payment_id);
        console.log("-----Payment-------")
        console.log(payment);
        res.json(payment);
    }catch(err){
        console.error("Error is ",err)
        res.json("Error");
    }
})

module.exports = router;
