// routes/get.js
// MongoDB update

const { MongoClient } = require("mongodb");

// MongoDB connection URI and database/collection name
const MONGO_URI = "mongodb+srv://Victor:7OkL03vI5PTE9FlJ@lentil.1fev0.mongodb.net/prj666_data_sense";
const DB_NAME = "prj666_datasense";
const COLLECTION_NAME = "users";

// Function to retrieve user history from MongoDB
async function getUserHistory(email) {
  const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

    // Find user by email
    const user = await collection.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    // Return the 'history' field (ensure it's limited to 20 records in MongoDB)
    return user.history || [];
  } finally {
    await client.close();
  }
}

module.exports = async (req, res) => {
  const email = req.query.email || "test123@abc.com" ; // Default email if none provided
  try {
    const history = await getUserHistory(email);
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching user history:", error.message);
    res.status(500).json({ message: "Failed to fetch user history", error: error.message });
  }
};
