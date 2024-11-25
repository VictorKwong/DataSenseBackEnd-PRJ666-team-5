import requests
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Backend upload endpoint
UPLOAD_URL = "https://datasensebackend-prj666-team-5.onrender.com/upload-csv"

# Path to the local CSV file
LOCAL_CSV_FILE = "./src/data/sensor_data.csv"

# Store the last uploaded line count
last_uploaded_line = 0


def upload_csv(new_data):
    try:
        # Log the data being uploaded
        print("Data being uploaded to server:")
        print(new_data)

        # Send the new data as a CSV-like string to the backend
        response = requests.post(
            UPLOAD_URL,
            files={"csvfile": ("sensor_data.csv", new_data)}  # Send new data as a file
        )

        # Check the response from the server
        if response.status_code == 200:
            print("CSV file uploaded successfully.")
        else:
            print(f"Failed to upload CSV file: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error uploading CSV file: {e}")


class CSVFileHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_uploaded_line = 0

    def on_modified(self, event):
        if event.src_path.endswith("sensor_data.csv"):
            print("Detected changes in the CSV file.")
            self.process_csv()

    def process_csv(self):
        global last_uploaded_line
        try:
            # Read the file and get new rows
            with open(LOCAL_CSV_FILE, "r") as file:
                lines = file.readlines()

            # Extract only the new rows
            new_rows = lines[self.last_uploaded_line:]
            if new_rows:
                print(f"Uploading {len(new_rows)} new rows.")
                new_data = "".join(new_rows)

                # Upload the new data
                upload_csv(new_data)

                # Update the last uploaded line count
                self.last_uploaded_line = len(lines)
        except Exception as e:
            print(f"Error processing CSV file: {e}")


def start_file_monitor():
    event_handler = CSVFileHandler()
    observer = Observer()
    observer.schedule(event_handler, path="./src/data", recursive=False)
    observer.start()
    print("Monitoring CSV file for changes...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


# Start monitoring the CSV file
start_file_monitor()
