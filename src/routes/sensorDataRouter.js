//routes/sensorDataRouter.js
const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  console.log(req.body); // To verify if the payload is being received
  res.status(200).json({ status: 200, message: "Data received successfully!" });
});

module.exports = router;
