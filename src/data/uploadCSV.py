import requests
import time

# Backend upload endpoint
UPLOAD_URL = "https://datasensebackend-prj666-team-5.onrender.com/upload-csv"

# Path to the local CSV file
LOCAL_CSV_FILE = "./src/data/sensor_data.csv"

# Store the last uploaded line count
last_uploaded_line = 0

def upload_csv(new_data):
    try:
        # Send the new data as a CSV-like string to the backend
        response = requests.post(
            UPLOAD_URL,
            files={"csvfile": ("sensor_data.csv", new_data)}  # Send new data as a file
        )

        # Check the response from the server
        if response.status_code == 200:
            print("CSV file uploaded successfully.")
        else:
            print(f"Failed to upload CSV file: {response.text}")
    except Exception as e:
        print(f"Error uploading CSV file: {e}")

def monitor_and_upload():
    global last_uploaded_line
    while True:
        try:
            # Read the file and get new rows
            with open(LOCAL_CSV_FILE, "r") as file:
                lines = file.readlines()

            # Extract only the new rows
            new_rows = lines[last_uploaded_line:]
            if new_rows:
                print(f"Uploading {len(new_rows)} new rows.")
                new_data = "".join(new_rows)
                upload_csv(new_data)

                # Update the last uploaded line count
                last_uploaded_line = len(lines)

        except Exception as e:
            print(f"Error reading CSV file: {e}")

        # Wait 15 seconds before checking again
        time.sleep(15)

# Start monitoring and uploading
monitor_and_upload()