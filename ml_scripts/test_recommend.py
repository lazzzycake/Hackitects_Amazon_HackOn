import requests
import json

url = "http://localhost:5000/recommend"
context = {
    "mood": "Happy",
    "intent": "Entertainment",
    "weather": "Sunny",
    "time_of_day": "Morning"
}

response = requests.post(url, json=context)

print("Status Code:", response.status_code)
try:
    print("Response:", json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error parsing response:", e)
    print("Raw response:", response.text) 