import socket
import csv
import os
import json
import time
from datetime import datetime, timezone
from threading import Thread
import pymongo
from pymongo import MongoClient

# Configuration
SERVER_IP = "0.0.0.0"  # Listen on all network interfaces
SERVER_PORT = 12345
CSV_FILE = "./src/data/sensor_data.csv"
MONGO_URI = "mongodb+srv://Victor:7OkL03vI5PTE9FlJ@lentil.1fev0.mongodb.net/prj666_data_sense"
DB_NAME = "prj666_datasense"
COLLECTION_NAME = "users"
USER_EMAIL = "test123@abc.com"  # Default email for sensor data test999@gmail.com

# MongoDB setup
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# Ensure the CSV file exists and write the header if needed
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["timestamp", "temperature", "humidity", "moisture"])  # CSV header

# Store the last uploaded line count
last_uploaded_line = 0

# Function to save sensor data to CSV
def save_to_csv(data):
    try:
        with open(CSV_FILE, mode="a", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([data["timestamp"], data["temperature"], data["humidity"], data["moisture"]])
    except Exception as e:
        print(f"Error saving to CSV: {e}")

# Function to format and print data
def format_and_print_data(data):
    print(f'{data["timestamp"]},{data["temperature"]},{data["humidity"]},{data["moisture"]}')

# Helper function to maintain the History field with a maximum of 20 records
def update_history(existing_doc, new_data, is_connected):
    history = existing_doc.get("history", [])
    history.insert(0, {
        "timestamp": new_data["timestamp"],
        "temperature": new_data["temperature"],
        "humidity": new_data["humidity"],
        "moisture": new_data["moisture"],
        "isConnected": is_connected,  # Add isConnected to history
    })
    if len(history) > 20:
        history.pop()  # Remove the oldest record
    collection.update_one(
        {"_id": existing_doc["_id"]},
        {"$set": {"history": history}}
    )

# Function to insert or update MongoDB
def insert_or_update_mongodb(new_rows):
    try:
        data_list = []
        for row in new_rows:
            fields = row.strip().split(",")
            if len(fields) == 4 and fields[0] != "timestamp":
                try:
                    timestamp, temperature, humidity, moisture = fields
                    data_list.append({
                        "email": USER_EMAIL,
                        "timestamp": timestamp,
                        "temperature": float(temperature),
                        "humidity": float(humidity),
                        "moisture": float(moisture),
                    })
                except ValueError as e:
                    print(f"Skipping invalid row: {fields}, error: {e}")

        for data in data_list:
            existing_doc = collection.find_one({"email": data["email"]})
            if existing_doc:
                print(f"Found existing entry for email {data['email']}. Updating.")
                update_history(existing_doc, data, is_connected=True)  # Pass isConnected as True
                collection.update_one(
                    {"_id": existing_doc["_id"]},
                    {"$set": {
                        "timestamp": data["timestamp"],
                        "temperature": data["temperature"],
                        "humidity": data["humidity"],
                        "moisture": data["moisture"],
                    }}
                )
            else:
                print(f"Insert new entry for email {data['email']}")
                collection.insert_one({
                    **data,
                    "history": [{
                        "timestamp": data["timestamp"],
                        "temperature": data["temperature"],
                        "humidity": data["humidity"],
                        "moisture": data["moisture"],
                        "isConnected": True,  # Include isConnected in the first history record
                    }],
                    "isConnected": True  # Initial connection status for the user
                })

    except Exception as e:
        print(f"Error inserting data into MongoDB: {e}")

# Function to monitor the CSV file and upload to MongoDB
def monitor_and_upload():
    global last_uploaded_line, running
    while running:
        try:
            with open(CSV_FILE, "r") as file:
                lines = file.readlines()
            header_offset = 1 if last_uploaded_line == 0 and lines[0].strip().split(",")[0] == "timestamp" else 0
            new_rows = lines[last_uploaded_line + header_offset:]
            if new_rows:
                print(f"Uploading {len(new_rows)} new rows to MongoDB.")
                insert_or_update_mongodb(new_rows)
                last_uploaded_line = len(lines)
        except Exception as e:
            print(f"Error reading CSV file: {e}")
        time.sleep(15)

# Function to update the connection status in MongoDB
def update_connection_status(status):
    try:
        # Find the document by email
        existing_doc = collection.find_one({"email": USER_EMAIL})
        
        if existing_doc:
            # Update the isConnected field in the first history entry
            # Using $set to update the first element in the history array
            collection.update_one(
                {"email": USER_EMAIL},
                {
                    "$set": {
                        "history.0.isConnected": status  # Update the first entry's isConnected in history
                    }
                }
            )
            print(f"Connection status in history updated to {status}")
        else:
            print("User not found in the database.")
            
    except Exception as e:
        print(f"Error updating connection status in history: {e}")

# Function to listen for 'q' input to quit the program
def monitor_exit():
    global running
    while running:
        user_input = input("Press 'q' and Enter to quit: ").strip().lower()
        if user_input == 'q':
            running = False
            update_connection_status(False)  # Set connection to False before exiting
            print("Exiting program...")
            os._exit(0)  # Forcefully exit all threads

# Function to start the server
def start_server():
    update_connection_status(True)  # Set connection to True when the server starts
    try:
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind((SERVER_IP, SERVER_PORT))
        server_socket.listen(5)
        print(f"Server started. Listening on {SERVER_IP}:{SERVER_PORT}")

        while running:  # Check if the script is still running
            client_socket, client_address = server_socket.accept()
            print(f"Connection received from {client_address}")

            try:
                data = client_socket.recv(1024).decode("utf-8")
                print(f"Raw data received: {data}")
                sensor_data = json.loads(data)
                sensor_data["timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
                save_to_csv(sensor_data)
                format_and_print_data(sensor_data)
                client_socket.sendall(b"Data received successfully.")
            except Exception as e:
                print(f"Error handling data: {e}")
            finally:
                client_socket.close()
    except Exception as e:
        print(f"Error starting server: {e}")
    finally:
        update_connection_status(False)  # Set connection to False if the server stops
        server_socket.close()

# Main entry point
if __name__ == "__main__":
    running = True  # Global variable to manage program state

    try:
        Thread(target=start_server).start()
        Thread(target=monitor_and_upload).start()
        Thread(target=monitor_exit).start()
    except KeyboardInterrupt:
        running = False
        update_connection_status(False)
        print("Program interrupted and exited.")
