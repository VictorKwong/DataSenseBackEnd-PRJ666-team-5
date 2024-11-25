//routes/uploadRouter.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser'); // You can use a library like csv-parser to parse CSV files.

const router = express.Router();

// Set up multer storage options for the uploaded file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the 'uploads' folder exists, if not create it
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath); // Specify the folder where the file will be saved
  },
  filename: (req, file, cb) => {
    // Save the file with a unique name (timestamp)
    cb(null, `sensor_data_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// POST route to upload CSV file
router.post('/upload-csv', upload.single('csvfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  // Process the uploaded CSV file (parse and handle it)
  const filePath = path.join(__dirname, '../uploads', req.file.filename);

  const rows = [];
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => {
      rows.push(row); // Push each row to the array
    })
    .on('end', () => {
      console.log('CSV Data:', rows); // Handle the parsed data (e.g., save to database)
      res.status(200).json({ message: 'CSV file uploaded and processed.', data: rows });
    })
    .on('error', (err) => {
      res.status(500).json({ message: 'Error reading the CSV file', error: err });
    });
});

module.exports = router;
