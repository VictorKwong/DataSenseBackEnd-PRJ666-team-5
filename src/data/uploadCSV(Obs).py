import requests
import time
import json

# Backend upload endpoint
UPLOAD_URL = "https://datasensebackend-prj666-team-5.onrender.com/upload/sensor-data"


# Path to the local CSV file
LOCAL_CSV_FILE = "./src/data/sensor_data.csv"

# Store the last uploaded line count
last_uploaded_line = 0


def upload_json(new_rows):
    """
    Send new sensor data rows as JSON to the backend.
    """
    try:
        # Convert rows into a list of JSON objects
        data_list = []
        for row in new_rows:
            fields = row.strip().split(",")  # Assumes CSV is comma-separated

            # Skip rows that don't have exactly 4 fields (or the header row)
            if len(fields) == 4 and fields[0] != "time":  # Header row check
                try:
                    time_stamp, temperature, humidity, moisture = fields
                    data_list.append({
                        "time": time_stamp,
                        "temperature": temperature,  # Ensure valid float
                        "humidity": humidity,
                        "moisture": moisture,
                    })
                except ValueError as e:
                    print(f"Skipping invalid row: {fields}, error: {e}")

        if not data_list:
            print("No valid data to upload.")
            return

        # Send JSON data to the backend
        response = requests.post(
            UPLOAD_URL,
            json={"data": data_list}  # Wrap the list in a JSON object
        )

        # Check the response from the server
        if response.status_code == 200:
            print("Data uploaded successfully.")
        else:
            print(f"Failed to upload data: {response.text}")

    except Exception as e:
        print(f"Error uploading data: {e}")


def monitor_and_upload():
    """
    Monitor the local CSV file for new rows and upload them as JSON.
    """
    global last_uploaded_line
    while True:
        try:
            # Read the file and get new rows
            with open(LOCAL_CSV_FILE, "r") as file:
                lines = file.readlines()

            # Skip the header row if it's the first run
            header_offset = 1 if last_uploaded_line == 0 and lines[0].strip().split(",")[0] == "time" else 0
            new_rows = lines[last_uploaded_line + header_offset:]

            if new_rows:
                print(f"Uploading {len(new_rows)} new rows.")
                upload_json(new_rows)

                # Update the last uploaded line count
                last_uploaded_line = len(lines)

        except Exception as e:
            print(f"Error reading CSV file: {e}")

        # Wait 15 seconds before checking again
        time.sleep(15)


# Start monitoring and uploading
monitor_and_upload()
