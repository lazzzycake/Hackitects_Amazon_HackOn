from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random
import os
from collections import defaultdict
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import boto3
from datetime import datetime
import requests

# Load environment variables from .env file
load_dotenv()

# ✅ Flask setup
app = Flask(__name__, static_folder='.', static_url_path='')
# Be more explicit with CORS to allow all origins for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# ✅ Paths
script_dir = os.path.dirname(__file__)
training_path = os.path.join(script_dir, "../data/training_data_bandit.json")
bandit_stats_path = os.path.join(script_dir, "../data/bandit_stats.json")
cred_path = os.path.join(script_dir, "serviceAccountKey.json")

# ✅ Firebase init
db = None
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
    except Exception as e:
        print(f"Warning: Firebase initialization failed: {e}")
        print("Running in local mode without Firebase connectivity")

# ✅ AWS Comprehend init
try:
    comprehend = boto3.client(
        'comprehend',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION')
    )
    print("✅ AWS Comprehend client initialized successfully.")
except Exception as e:
    comprehend = None
    print(f"⚠️ Warning: AWS Comprehend initialization failed: {e}")
    print("Sentiment analysis will be unavailable.")

# ✅ Keyword mapping for Intent and Sub-Intent
INTENT_KEYWORDS = {
    "Entertainment": ["movie", "show", "film", "watch", "series", "episode"],
    "Relaxation": ["relax", "chill", "unwind", "easy", "calm", "bed"],
    "Focus": ["focus", "work", "study", "background", "concentrate", "cook", "workout", "get things done"]
}

SUB_INTENT_KEYWORDS = {
    "Workout": ["workout", "exercise", "gym", "run", "fitness"],
    "Cooking": ["cook", "baking", "kitchen", "recipe", "food"]
}

def get_weather_from_ip():
    """Fetches weather from wttr.in based on the request's IP address."""
    try:
        # Use a service to get the public IP if running locally
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ip_address == '127.0.0.1':
            # Fallback for local development
            print("Running locally, using smart fallback for weather.")
            time_of_day = get_time_of_day()
            if time_of_day == "Night":
                return "Clear"
            else:
                return "Sunny"
        
        # wttr.in provides a simple JSON format
        response = requests.get(f'https://wttr.in/{ip_address}?format=j1')
        response.raise_for_status() # Raise an exception for bad status codes
        weather_data = response.json()
        
        # Extract the first weather description
        return weather_data.get('current_condition', [{}])[0].get('weatherDesc', [{}])[0].get('value', 'Sunny')
    except requests.RequestException as e:
        print(f"🔥 Weather API Error: {e}")
        return "Sunny" # Default to Sunny on API failure

def get_intent_from_text(text, sub_intent_text=""):
    text_lower = text.lower().strip()
    # Determine the main intent first, based *only* on the activity response
    intent = "Entertainment" # Default
    for intent_key, keywords in INTENT_KEYWORDS.items():
        if any(keyword in text_lower for keyword in keywords):
            intent = intent_key
            break
    
    # Now, *only if* the intent is Focus, check for a sub-intent
    if intent == "Focus" and sub_intent_text:
        sub_text_lower = sub_intent_text.lower().strip()
        for sub_intent, sub_keywords in SUB_INTENT_KEYWORDS.items():
            if any(sub_keyword in sub_text_lower for sub_keyword in sub_keywords):
                return intent, sub_intent # Return Focus and its sub-intent
    
    # For any other case (including Focus with no sub-intent), return the intent with no sub-intent
    return intent, None

def get_time_of_day():
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "Morning"
    elif 12 <= hour < 17:
        return "Afternoon"
    elif 17 <= hour < 21:
        return "Evening"
    else:
        return "Night"

# ✅ Load training data
with open(training_path) as f:
    training_data = json.load(f)

# ✅ Load all movies into memory once to avoid repeated file reads
all_movies = []
movies_path = os.path.join(os.path.dirname(__file__), "../data/movies.json")
if os.path.exists(movies_path):
    with open(movies_path, 'r', encoding='utf-8') as f:
        all_movies = json.load(f)

# Create a lookup table for faster access
movies_by_title = {movie['title']: movie for movie in all_movies}

# Helper to convert context dict to a unique string key
# Always use the same order of keys!
def context_to_key(context):
    """Convert a context dictionary to a unique string key."""
    return f"{context.get('mood','')}|{context.get('intent','')}|{context.get('sub_intent', '')}|{context.get('weather','')}|{context.get('time_of_day','') or context.get('timeOfDay','')}"

# ✅ Fallback recommendation
def fallback_recommendation(context):
    """Fallback if bandit has no data. Filters by intent/mood if possible."""
    target_intent = context.get('intent')
    target_sub_intent = context.get('sub_intent')
    
    # Use the in-memory 'all_movies' list instead of reading from file
    
    # First, try to filter by sub_intent if it exists
    if target_sub_intent:
        filtered_movies = [m for m in all_movies if isinstance(m, dict) and m.get('sub_intent') == target_sub_intent]
        if filtered_movies:
            return random.sample(filtered_movies, min(10, len(filtered_movies)))

    # If no sub_intent match, filter by main intent
    if target_intent:
        filtered_movies = [m for m in all_movies if isinstance(m, dict) and m.get('intent') == target_intent]
        if filtered_movies:
            return random.sample(filtered_movies, min(10, len(filtered_movies)))
    
    # If all else fails, return a truly random sample of valid movie objects
    valid_movies = [m for m in all_movies if isinstance(m, dict) and 'title' in m]
    return random.sample(valid_movies, min(10, len(valid_movies)))

def calculate_dynamic_epsilon(context_stats):
    """Calculate epsilon dynamically based on context maturity"""
    if not context_stats:
        return 0.5  # High exploration for new contexts
    
    total_views = sum(movie["count"] for movie in context_stats.values())
    # Start with 0.5, decay to 0.1 as views increase
    return max(0.1, 0.5 * (1 / (1 + total_views * 0.1)))

def get_context_confidence(context_stats, title):
    """Calculate confidence score for a movie in a context"""
    if not context_stats or title not in context_stats:
        return 0
    
    views = context_stats[title]["count"]
    avg_reward = context_stats[title]["reward"] / max(views, 1)
    # More views = more confidence
    confidence = avg_reward * (1 - (1 / (1 + views)))
    return confidence

def recommend_movies(context, user_id="default_user"):
    """
    Recommends movies using an epsilon-greedy contextual bandit algorithm.
    Returns a list of full movie objects.
    """
    context_key = context_to_key(context)
    current_sub_intent = context.get('sub_intent')

    # --- Strict Sub-Intent Filtering ---
    if current_sub_intent:
        print(f"🔍 STRICT MODE: Filtering ONLY for sub_intent '{current_sub_intent}'")
        sub_intent_movies = [m for m in all_movies if m.get('sub_intent') == current_sub_intent]
        if sub_intent_movies:
            return random.sample(sub_intent_movies, min(10, len(sub_intent_movies)))
        else:
            return [] # No movies match this specific sub-intent

    # --- Load Bandit Statistics ---
    if os.path.exists(bandit_stats_path):
        with open(bandit_stats_path) as f:
            stats = json.load(f)
    else:
        print("⚠️ No bandit_stats.json found. Using fallback.")
        return fallback_recommendation(context)

    # --- Find Available Movies for Context ---
    context_stats = stats.get(context_key, {})
    all_titles_in_context = list(context_stats.keys())

    # Use similarity search if no movies for the exact context
    if not all_titles_in_context:
        print("No exact match for context. Using similarity search...")
        similar_contexts = find_similar_contexts(context_key, stats)
        for similar_key in similar_contexts:
            all_titles_in_context.extend(list(stats[similar_key].keys()))
        all_titles_in_context = list(set(all_titles_in_context))

    if not all_titles_in_context:
        print("No movies found in bandit stats or similar contexts. Using fallback.")
        return fallback_recommendation(context)

    # --- Epsilon-Greedy Logic ---
    epsilon = calculate_dynamic_epsilon(context_stats)
    
    if random.random() < epsilon:
        # Exploration: Choose a random sample of movies from the available list
        print(f"🧭 EXPLORING with epsilon {epsilon:.2f}")
        random_titles = random.sample(all_titles_in_context, min(10, len(all_titles_in_context)))
        # Convert titles to full movie objects
        recommendations = [movies_by_title[title] for title in random_titles if title in movies_by_title]
        
        # Ensure we have 10 recommendations by supplementing if needed
        if len(recommendations) < 10:
            print(f"⚠️ Only {len(recommendations)} movies in context, supplementing with similar movies...")
            recommendations = supplement_recommendations(recommendations, context, 10)
        
        return recommendations

    else:
        # Exploitation: Choose the best movies based on historical reward
        print(f"🎯 EXPLOITING with epsilon {epsilon:.2f}")
        
        scored_titles = []
        for title in all_titles_in_context:
            if title not in context_stats: continue # Should not happen, but a safeguard
            
            # Calculate the base score (average reward)
            views = context_stats[title]["count"]
            reward = context_stats[title]["reward"]
            avg_reward = reward / max(views, 1)
            
            # The final score is now just the confidence score
            final_score = avg_reward * (1 - (1 / (1 + views)))
            scored_titles.append((title, final_score))

        # Sort by the final score and get the top 10
        sorted_titles = sorted(scored_titles, key=lambda x: x[1], reverse=True)
        top_titles = [title for title, score in sorted_titles[:10]]
        
        # Convert titles to full movie objects
        recommendations = [movies_by_title[title] for title in top_titles if title in movies_by_title]
        
        # Ensure we have 10 recommendations by supplementing if needed
        if len(recommendations) < 10:
            print(f"⚠️ Only {len(recommendations)} movies in context, supplementing with similar movies...")
            recommendations = supplement_recommendations(recommendations, context, 10)
        
        return recommendations

def find_similar_contexts(context_key, stats):
    """Finds contexts similar to the given one based on shared attributes."""
    key_parts = context_key.split("|")
    if len(key_parts) != 5:
        # This context is malformed or old, can't find similarities for it.
        return []
    mood, intent, sub_intent, weather, time = key_parts
    
    similar_contexts = []
    
    for key in stats:
        other_key_parts = key.split("|")
        if len(other_key_parts) != 5:
            # Skip stats from old, 4-part keys
            continue

        other_mood, other_intent, other_sub_intent, other_weather, other_time = other_key_parts
        similarity_score = 0
        
        # Weight different attributes
        if mood == other_mood: similarity_score += 0.4
        if intent == other_intent: similarity_score += 0.3
        # Only compare sub_intent if it's meaningful
        if sub_intent and sub_intent == other_sub_intent: similarity_score += 0.15
        if weather == other_weather: similarity_score += 0.1
        if time == other_time: similarity_score += 0.05
        
        if similarity_score > 0.4:  # Consider contexts with >40% similarity
            similar_contexts.append(key)
    
    return similar_contexts

def supplement_recommendations(current_recommendations, context, target_count=10):
    """
    Supplement recommendations to reach the target count by adding movies
    that match the mood and intent but aren't in the current context.
    """
    current_titles = {movie['title'] for movie in current_recommendations}
    target_mood = context.get('mood', 'Neutral')
    target_intent = context.get('intent', 'Entertainment')
    
    # Find movies that match the mood and intent but aren't already recommended
    supplementary_movies = []
    for movie in all_movies:
        if movie['title'] in current_titles:
            continue  # Skip already recommended movies
            
        movie_mood = movie.get('mood_tag', 'Neutral')
        movie_intent = movie.get('intent', 'Entertainment')
        
        # Check if movie matches the target mood and intent
        if movie_mood == target_mood and movie_intent == target_intent:
            supplementary_movies.append(movie)
    
    # If we still don't have enough, add movies with matching intent
    if len(supplementary_movies) < (target_count - len(current_recommendations)):
        for movie in all_movies:
            if movie['title'] in current_titles or movie in supplementary_movies:
                continue
                
            movie_intent = movie.get('intent', 'Entertainment')
            if movie_intent == target_intent:
                supplementary_movies.append(movie)
    
    # If we still don't have enough, add any remaining movies
    if len(supplementary_movies) < (target_count - len(current_recommendations)):
        for movie in all_movies:
            if movie['title'] in current_titles or movie in supplementary_movies:
                continue
            supplementary_movies.append(movie)
    
    # Shuffle and add supplementary movies
    random.shuffle(supplementary_movies)
    needed_count = target_count - len(current_recommendations)
    supplementary_movies = supplementary_movies[:needed_count]
    
    # Combine and return
    final_recommendations = current_recommendations + supplementary_movies
    print(f"✅ Supplemented with {len(supplementary_movies)} additional movies. Total: {len(final_recommendations)}")
    
    return final_recommendations

@app.route('/')
def index():
    """A simple endpoint to confirm the API is running."""
    return jsonify({"status": "ok", "message": "FireTV Recommendation API is running."})

@app.route('/api/movies', methods=['GET'])
def get_all_movies():
    """Returns all movies for search functionality."""
    try:
        return jsonify(all_movies)
    except Exception as e:
        print(f"❌ Error fetching all movies: {e}")
        return jsonify({"error": "Failed to fetch movies"}), 500

def _generate_context_logic(data):
    """Helper function to generate context from request data."""
    mood_response = data.get("mood_response", "")
    activity_response = data.get("activity_response", "")
    sub_intent_text = data.get("sub_intent_text", "") # New field for specific focus tasks
    user_id = data.get("user_id", "guest")

    # 1. Get Mood from AWS Comprehend or fallback
    mood = "Neutral"
    if comprehend and mood_response:
        try:
            response = comprehend.detect_sentiment(Text=mood_response, LanguageCode='en')
            mood = response['Sentiment'].capitalize()
        except Exception as e:
            print(f"Comprehend Error: {e}")
            if any(w in mood_response.lower() for w in ["good", "great", "happy", "amazing"]):
                mood = "Positive"
            elif any(w in mood_response.lower() for w in ["bad", "sad", "terrible"]):
                mood = "Negative"

    # 2. Get Intent from keyword mapping
    intent, sub_intent = get_intent_from_text(activity_response, sub_intent_text)

    # 3. Get Weather and Time of Day
    weather = get_weather_from_ip()
    time_of_day = get_time_of_day()

    context = {
        "mood": mood,
        "intent": intent,
        "weather": weather,
        "time_of_day": time_of_day
    }
    # Only add sub_intent to the context object if it has a value
    if sub_intent:
        context['sub_intent'] = sub_intent

    # Log the generated context to Firestore
    if db:
        try:
            # Use the UserMoods collection as requested
            user_mood_ref = db.collection('UserMoods').document(user_id)
            user_mood_ref.set({
                'context': context,
                'raw_inputs': data,
                'timestamp': datetime.now()
            }, merge=True)
            print(f"✅ Context for user {user_id} saved to UserMoods in Firestore.")
        except Exception as e:
            print(f"❌ Firestore Error: Failed to save user context: {e}")
            
    return context

@app.route("/generate-context", methods=["POST"])
def generate_context():
    """Generates a context object from the request data."""
    data = request.get_json() or {}
    context = _generate_context_logic(data)
    return jsonify(context)

@app.route("/recommend", methods=["POST"])
def recommend():
    """Recommend movies based on the provided context."""
    print("✅ --- Request received at /recommend endpoint --- ✅") # Diagnostic print
    data = request.get_json() or {}
    user_id = data.get("user_id", "guest")
    
    # Generate context internally using the refactored helper function
    context = _generate_context_logic(data)
    
    recommendations = recommend_movies(context, user_id)

    if not recommendations:
        return jsonify({"error": "No recommendations found for this context.", "recommendations": []}), 404

    return jsonify({"recommendations": recommendations})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
