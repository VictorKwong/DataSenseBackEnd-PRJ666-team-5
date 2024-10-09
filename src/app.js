const express = require("express");
const cors = require("cors");

const app = express();
const { passport } = require("./jwtConfig");

app.use(passport.initialize());

// Create an express app instance we can use to attach middleware and HTTP routes

// Use CORS middleware so we can make requests across origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Define our routes
app.use("/", require("./routes"));

// Add 404 middleware to handle any requests for resources that can't be found
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: "Not Found",
  });
});

// Add error-handling middleware to deal with anything else
app.use((err, req, res, next) => {
  // Set default status and message if none are provided
  const status = err.status || 500;
  const message = err.message || "Unable to process request";

  // Log the error to the console for server errors (5xx)
  if (status >= 500) {
    console.error(`Error processing request:`, err);
  }

  // Send the error response
  res.status(status).json({
    status,
    message,
  });
});

// Export our `app` so we can access it in server.js
module.exports = app;
