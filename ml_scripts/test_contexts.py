import requests
import json
import time
from requests.exceptions import ConnectionError

def test_recommendations(context):
    try:
        print(f"\nTesting context: {json.dumps(context, indent=2)}")
        response = requests.post("http://localhost:5000/recommend", json=context)
        print("Status:", response.status_code)
        if response.status_code == 200:
            print("Recommendations:", json.dumps(response.json(), indent=2))
            return response.json()
        else:
            print("Error:", response.text)
            return None
    except ConnectionError as e:
        print("Connection error. Make sure the Flask server is running.")
        return None

def give_feedback(user_id, context, movie_title, reward):
    try:
        print(f"\nGiving feedback for movie: {movie_title}")
        print(f"Context: {json.dumps(context, indent=2)}")
        print(f"Reward: {reward}")
        
        response = requests.post("http://localhost:5000/feedback", json={
            "user_id": user_id,
            "context": context,
            "movie_title": movie_title,
            "reward": reward
        })
        print("Feedback Status:", response.status_code)
        if response.status_code != 200:
            print("Error:", response.text)
    except ConnectionError as e:
        print("Connection error. Make sure the Flask server is running.")

def main():
    # Test 1: Happy Morning Context
    context1 = {
        "mood": "Happy",
        "intent": "Entertainment",
        "weather": "Sunny",
        "time_of_day": "Morning"
    }

    # Test 2: Sad Evening Context
    context2 = {
        "mood": "Sad",
        "intent": "Contemplation",
        "weather": "Rainy",
        "time_of_day": "Evening"
    }

    print("=== Testing Different Contexts ===")

    # Get recommendations for context1
    movies1 = test_recommendations(context1)

    if movies1 and movies1.get("recommendations"):
        # Give positive feedback to first movie in context1
        movie_title_1 = movies1["recommendations"][0]["title"]
        give_feedback("test_user_1", context1, movie_title_1, 5)
        time.sleep(2)  # Wait a bit before getting new recommendations
        print("\nGetting new recommendations after feedback:")
        test_recommendations(context1)

    # Test different context
    print("\n=== Testing Different Context ===")
    movies2 = test_recommendations(context2)

    if movies2 and movies2.get("recommendations"):
        # Give different feedback in context2
        movie_title_2 = movies2["recommendations"][0]["title"]
        give_feedback("test_user_1", context2, movie_title_2, 3)
        time.sleep(2)
        print("\nGetting new recommendations after feedback:")
        test_recommendations(context2)

if __name__ == "__main__":
    main() 