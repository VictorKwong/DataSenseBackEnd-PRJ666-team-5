const path = require('path');
const csvWriter = require('csv-writer');
const { broadcast } = require('../websocket');

const filePath = path.join(__dirname, '../data/sensor_data.csv');

const csvWriterInstance = csvWriter.createObjectCsvWriter({
  path: filePath,
  header: [
    { id: 'timestamp', title: 'timestamp' },
    { id: 'temperature', title: 'temperature' },
    { id: 'humidity', title: 'humidity' },
    { id: 'moisture', title: 'moisture' }
  ],
  append: true // Append data instead of overwriting
});

module.exports = (req, res) => {
  const { temperature, humidity, moisture } = req.body;

  if (temperature === undefined || humidity === undefined || moisture === undefined) {
    return res.status(400).json({ message: 'Missing sensor data' });
  }

  const data = {
    timestamp: new Date().toISOString(),
    temperature,
    humidity,
    moisture
  };

  csvWriterInstance.writeRecords([data])
    .then(() => {
      // Broadcast the data to the connected clients
      broadcast(data);
      res.status(200).json({ message: 'Sensor data recorded and broadcasted' });
    })
    .catch(err => res.status(500).json({ message: 'Failed to write data', error: err }));
};
