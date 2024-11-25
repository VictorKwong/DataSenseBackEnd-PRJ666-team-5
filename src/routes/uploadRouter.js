//routes/uploadRouter.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Path to the CSV file on the server
const CSV_FILE_PATH = path.join(__dirname, "../data/sensor_data.csv");

router.post("/", (req, res) => {
  try {
    const { data } = req.body; // Expecting { data: [...] }
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ status: 400, message: "Invalid or empty data array" });
    }

    // Convert the JSON data to CSV rows
    const csvRows = data.map(row => {
      const { time, temperature, humidity, moisture } = row;

      // Validate required fields
      if (!time || temperature == null || humidity == null || moisture == null) {
        throw new Error("Missing required fields in data.");
      }

      return `${time},${temperature},${humidity},${moisture}`;
    });

    // Append rows to the CSV file
    fs.appendFileSync(CSV_FILE_PATH, csvRows.join("\n") + "\n", "utf8");

    console.log("Data appended to CSV:", csvRows);
    res.status(200).json({ status: 200, message: "Data successfully saved to CSV." });
  } catch (error) {
    console.error("Error saving data to CSV:", error.message);
    res.status(500).json({ status: 500, message: error.message });
  }
});

module.exports = router;
