import socket
import csv
import os
from datetime import datetime, timezone
import json

# Server details
SERVER_IP = "0.0.0.0"  # Listen on all network interfaces
SERVER_PORT = 12345
CSV_FILE = "./src/data/sensor_data.csv"

# Ensure the CSV file exists and write the header if needed
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["timestamp", "temperature", "humidity", "moisture"])  # CSV header

# Function to save sensor data to CSV
def save_to_csv(data):
    try:
        with open(CSV_FILE, mode="a", newline="") as file:
            writer = csv.writer(file)
            # Add a timestamp to the data
            writer.writerow([data["timestamp"], data["temperature"], data["humidity"], data["moisture"]])
    except Exception as e:
        print(f"Error saving to CSV: {e}")

# Function to format data and print it like a CSV
def format_and_print_data(data):
    print(f'{data["timestamp"]},{data["temperature"]},{data["humidity"]},{data["moisture"]}')

# Function to start the server
def start_server():
    try:
        # Create a TCP socket
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind((SERVER_IP, SERVER_PORT))
        server_socket.listen(5)
        print(f"Server started. Listening on {SERVER_IP}:{SERVER_PORT}")

        while True:
            client_socket, client_address = server_socket.accept()
            print(f"Connection received from {client_address}")

            try:
                # Receive data from the client
                data = client_socket.recv(1024).decode("utf-8")
                print(f"Raw data received: {data}")

                # Parse the JSON data
                sensor_data = json.loads(data)

                # Add a timestamp in UTC with the desired format
                sensor_data["timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

                # Save to CSV
                save_to_csv(sensor_data)

                # Print formatted data
                format_and_print_data(sensor_data)

                # Acknowledge the client
                client_socket.sendall(b"Data received successfully.")
            except Exception as e:
                print(f"Error handling data: {e}")
            finally:
                client_socket.close()
    except Exception as e:
        print(f"Error starting server: {e}")
    finally:
        server_socket.close()

# Start the server
start_server()
