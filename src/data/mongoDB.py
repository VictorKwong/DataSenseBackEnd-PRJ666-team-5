import time
import csv
import pymongo
from pymongo import MongoClient

# MongoDB connection string
MONGO_URI = "mongodb+srv://Victor:7OkL03vI5PTE9FlJ@lentil.1fev0.mongodb.net/prj666_data_sense"
DB_NAME = "prj666_datasense"
COLLECTION_NAME = "users"

# Path to the local CSV file
LOCAL_CSV_FILE = "./src/data/sensor_data.csv"

# Store the last uploaded line count
last_uploaded_line = 0

# Email for processing test123@abc.com
USER_EMAIL = "test123@abc.com"

# Set up MongoDB client
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# Helper function to maintain the History field with a maximum of 20 records
def update_history(existing_doc, new_data):
    """
    Update the 'history' array in the existing document.
    If the history exceeds 20 records, the oldest record is removed.
    """
    # Get the current history from the document
    history = existing_doc.get("history", [])
    
    # Add the new data to the history (prepend to keep it at the start)
    history.insert(0, {
        "timestamp": new_data["timestamp"],
        "temperature": new_data["temperature"],
        "humidity": new_data["humidity"],
        "moisture": new_data["moisture"],
        "isConnected": new_data["isConnected"],  # Add isConnected status to the history
    })
    
    # Ensure that the history has no more than 20 records
    if len(history) > 20:
        history.pop()  # Remove the oldest record (last item in the list)

    # Update the document with the new history
    collection.update_one(
        {"_id": existing_doc["_id"]},  # Match by _id of the existing document
        {"$set": {"history": history}}
    )

def insert_or_update_mongodb(new_rows):
    """
    Insert or update the rows of sensor data into MongoDB.
    If an entry with the same email exists, it will update the document with new data.
    """
    try:
        data_list = []
        for row in new_rows:
            fields = row.strip().split(",")  # Assumes CSV is comma-separated

            if len(fields) == 4 and fields[0] != "timestamp":  # Skip header row
                try:
                    timestamp, temperature, humidity, moisture = fields
                    data_list.append({
                        "email": USER_EMAIL,
                        "timestamp": timestamp,
                        "temperature": float(temperature),
                        "humidity": float(humidity),
                        "moisture": float(moisture),
                        "isConnected": False  # Always set connection to false
                    })
                except ValueError as e:
                    print(f"Skipping invalid row: {fields}, error: {e}")

        if data_list:
            for data in data_list:
                # Find document by email only
                existing_doc = collection.find_one({"email": data["email"]})

                if existing_doc:
                    print(f"Found existing entry for email {data['email']}. Updating.")
                    # Update the history
                    update_history(existing_doc, data)

                    # Update the latest sensor data and connection status
                    collection.update_one(
                        {"_id": existing_doc["_id"]},
                        {"$set": {
                            "timestamp": data["timestamp"],
                            "temperature": data["temperature"],
                            "humidity": data["humidity"],
                            "moisture": data["moisture"],
                            "isConnected": False  # Update connection to false
                        }}
                    )
                else:
                    print(f"Insert new entry for email {data['email']}")
                    # Insert new document
                    collection.insert_one({
                        **data,
                        "history": [{
                            "timestamp": data["timestamp"],
                            "temperature": data["temperature"],
                            "humidity": data["humidity"],
                            "moisture": data["moisture"],
                            "isConnected": data["isConnected"],  # Include isConnected in the history
                        }]
                    })

        else:
            print("No valid data to insert into MongoDB.")
    except Exception as e:
        print(f"Error inserting data into MongoDB: {e}")

def monitor_and_upload():
    """
    Monitor the local CSV file for new rows and insert them into MongoDB.
    """
    global last_uploaded_line
    while True:
        try:
            with open(LOCAL_CSV_FILE, "r") as file:
                lines = file.readlines()

            # Skip the header row if it's the first run
            header_offset = 1 if last_uploaded_line == 0 and lines[0].strip().split(",")[0] == "timestamp" else 0
            new_rows = lines[last_uploaded_line + header_offset:]

            if new_rows:
                print(f"Uploading {len(new_rows)} new rows to MongoDB.")
                insert_or_update_mongodb(new_rows)

                # Update the last uploaded line count
                last_uploaded_line = len(lines)

        except Exception as e:
            print(f"Error reading CSV file: {e}")

        # Wait 15 seconds before checking again
        time.sleep(15)

# Start monitoring and uploading
monitor_and_upload()
