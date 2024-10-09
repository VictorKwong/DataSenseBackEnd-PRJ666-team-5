const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");

/**
 *  Send the sensor data to UI application
 */
module.exports = (req, res) => {
  const filePath = path.join(__dirname, "../data/sensor_data.csv");
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {
      console.log("result", results.length, results);
      res.status(200).json(results);
    })
    .on("error", (err) => {
      res
        .status(500)
        .json({ message: "Unable to read sensor data", error: err });
    });
};
