const express = require("express");

const router = express.Router();

// Simple GET - health check route
router.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Success! Server is running.",
  });
});

// user routes
router.use("/users", require("./usersRouter"));

// Link routes to route handlers
router.post("/sensor-data", require("./post"));
router.get("/sensor-data", require("./get"));

// Export the router
module.exports = router;
