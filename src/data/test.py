import requests

# Define the URL for the API endpoint
url = "https://datasensebackend-prj666-team-5.onrender.com/upload/sensor-data"

# Define the JSON payload to send
payload = {
    "data": [
        {
            "time": "2024-11-25T12:00:00Z",
            "temperature": 22.5,
            "humidity": 60,
            "moisture": 30
        }
    ]
}

# Send the POST request
response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})

# Print the response status code and JSON response
print(response.status_code)  # Should print 200 if successful
print(response.json())       # Should print the JSON response from the server
