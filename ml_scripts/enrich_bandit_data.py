#!/usr/bin/env python3
"""
Enrich Bandit Training Data Script

This script generates comprehensive training data for all mood and intent combinations
to ensure the bandit algorithm has good coverage and can provide diverse recommendations
across all possible contexts.

Usage:
    python enrich_bandit_data.py
"""

import json
import random
import os
from collections import defaultdict

# Define all possible context dimensions
MOODS = ["Positive", "Negative", "Neutral"]
INTENTS = ["Entertainment", "Relaxation", "Focus"]
SUB_INTENTS = ["Workout", "Cooking", None]  # None for no sub-intent
WEATHER_CONDITIONS = ["Sunny", "Rainy", "Cloudy", "Clear"]
TIME_PERIODS = ["Morning", "Afternoon", "Evening", "Night"]

def load_movies():
    """Load all movies from movies.json"""
    script_dir = os.path.dirname(__file__)
    movies_path = os.path.join(script_dir, "../data/movies.json")
    
    with open(movies_path, 'r', encoding='utf-8') as f:
        movies = json.load(f)
    
    return movies

def categorize_movies_by_context(movies):
    """Categorize movies by their mood_tag and intent"""
    categorized = defaultdict(list)
    
    for movie in movies:
        mood = movie.get('mood_tag', 'Neutral')
        intent = movie.get('intent', 'Entertainment')
        sub_intent = movie.get('sub_intent')
        
        # Create context key for categorization
        if sub_intent:
            context_key = f"{mood}|{intent}|{sub_intent}"
        else:
            context_key = f"{mood}|{intent}"
        
        categorized[context_key].append(movie)
    
    return categorized

def generate_context_key(mood, intent, sub_intent, weather, time_of_day):
    """Generate a context key string"""
    if sub_intent:
        return f"{mood}|{intent}|{sub_intent}|{weather}|{time_of_day}"
    else:
        return f"{mood}|{intent}||{weather}|{time_of_day}"

def create_training_data_for_context(context_key, movies, num_interactions=15):
    """Create training data for a specific context"""
    context_data = {}
    
    # Select movies that match this context
    mood, intent, sub_intent, weather, time_of_day = context_key.split("|")
    
    # Filter movies by mood and intent
    matching_movies = []
    for movie in movies:
        movie_mood = movie.get('mood_tag', 'Neutral')
        movie_intent = movie.get('intent', 'Entertainment')
        movie_sub_intent = movie.get('sub_intent')
        
        # Check if movie matches the context
        mood_match = movie_mood == mood
        intent_match = movie_intent == intent
        
        if sub_intent and movie_sub_intent:
            sub_intent_match = movie_sub_intent == sub_intent
            if mood_match and intent_match and sub_intent_match:
                matching_movies.append(movie)
        else:
            if mood_match and intent_match:
                matching_movies.append(movie)
    
    # If no exact matches, use movies with similar mood/intent
    if not matching_movies:
        for movie in movies:
            movie_mood = movie.get('mood_tag', 'Neutral')
            movie_intent = movie.get('intent', 'Entertainment')
            
            # Include movies with same mood or same intent
            if movie_mood == mood or movie_intent == intent:
                matching_movies.append(movie)
    
    # Ensure we have enough movies
    if len(matching_movies) < 5:
        # Add some random movies to ensure variety
        all_movies = [m for m in movies if m not in matching_movies]
        additional_movies = random.sample(all_movies, min(10, len(all_movies)))
        matching_movies.extend(additional_movies)
    
    # Create interactions for each movie
    for movie in matching_movies[:20]:  # Limit to 20 movies per context
        # Generate realistic reward distribution
        # Movies with matching mood/intent get higher rewards
        movie_mood = movie.get('mood_tag', 'Neutral')
        movie_intent = movie.get('intent', 'Entertainment')
        
        base_reward = 0
        if movie_mood == mood:
            base_reward += 1
        if movie_intent == intent:
            base_reward += 1
        if sub_intent and movie.get('sub_intent') == sub_intent:
            base_reward += 2
        
        # Generate multiple interactions with varying rewards
        for i in range(random.randint(1, 3)):  # 1-3 interactions per movie
            # Add some randomness to rewards
            reward = max(0, base_reward + random.randint(-1, 1))
            count = random.randint(1, 3)
            
            context_data[movie['title']] = {
                "reward": reward,
                "count": count
            }
    
    return context_data

def generate_comprehensive_training_data():
    """Generate comprehensive training data for all context combinations"""
    print("🎬 Loading movies...")
    movies = load_movies()
    print(f"✅ Loaded {len(movies)} movies")
    
    # Create comprehensive bandit stats
    bandit_stats = {}
    
    # Generate data for all mood/intent combinations
    total_contexts = 0
    
    for mood in MOODS:
        for intent in INTENTS:
            for sub_intent in SUB_INTENTS:
                for weather in WEATHER_CONDITIONS:
                    for time_of_day in TIME_PERIODS:
                        context_key = generate_context_key(mood, intent, sub_intent, weather, time_of_day)
                        
                        # Skip if sub_intent is None but intent is Focus
                        if intent == "Focus" and sub_intent is None:
                            continue
                        
                        # Skip if sub_intent is not None but intent is not Focus
                        if intent != "Focus" and sub_intent is not None:
                            continue
                        
                        print(f"📊 Generating data for: {context_key}")
                        
                        context_data = create_training_data_for_context(context_key, movies)
                        bandit_stats[context_key] = context_data
                        total_contexts += 1
    
    # Add some special high-priority contexts with more data
    priority_contexts = [
        "Positive|Entertainment||Sunny|Evening",
        "Positive|Entertainment||Cloudy|Evening", 
        "Positive|Relaxation||Sunny|Evening",
        "Neutral|Entertainment||Sunny|Evening",
        "Negative|Entertainment||Rainy|Night",
        "Positive|Focus|Workout|Sunny|Morning",
        "Positive|Focus|Cooking|Sunny|Evening",
        "Neutral|Focus|Workout|Cloudy|Morning",
        "Happy|Entertainment||Sunny|Evening",  # Common user input
        "Good|Entertainment||Sunny|Evening",   # Alternative mood input
    ]
    
    for context_key in priority_contexts:
        if context_key not in bandit_stats:
            print(f"⭐ Adding priority context: {context_key}")
            context_data = create_training_data_for_context(context_key, movies, num_interactions=25)
            bandit_stats[context_key] = context_data
            total_contexts += 1
    
    print(f"✅ Generated data for {total_contexts} contexts")
    
    return bandit_stats

def save_bandit_stats(bandit_stats):
    """Save the enriched bandit stats to file"""
    script_dir = os.path.dirname(__file__)
    output_path = os.path.join(script_dir, "../data/bandit_stats.json")
    
    # Create backup of existing file
    if os.path.exists(output_path):
        backup_path = output_path + ".backup"
        print(f"💾 Creating backup: {backup_path}")
        with open(output_path, 'r') as f:
            existing_data = f.read()
        with open(backup_path, 'w') as f:
            f.write(existing_data)
    
    # Save new enriched data
    print(f"💾 Saving enriched bandit stats to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(bandit_stats, f, indent=4, ensure_ascii=False)
    
    print("✅ Enriched bandit stats saved successfully!")

def analyze_coverage(bandit_stats):
    """Analyze the coverage of the generated data"""
    print("\n📊 Coverage Analysis:")
    print("=" * 50)
    
    context_counts = {}
    total_movies = 0
    
    for context_key, movies in bandit_stats.items():
        parts = context_key.split("|")
        if len(parts) >= 2:
            mood_intent = f"{parts[0]}|{parts[1]}"
            if mood_intent not in context_counts:
                context_counts[mood_intent] = 0
            context_counts[mood_intent] += 1
            total_movies += len(movies)
    
    print(f"Total contexts: {len(bandit_stats)}")
    print(f"Total movie interactions: {total_movies}")
    print(f"Average movies per context: {total_movies / len(bandit_stats):.1f}")
    
    print("\nContext distribution:")
    for mood_intent, count in sorted(context_counts.items()):
        print(f"  {mood_intent}: {count} contexts")
    
    # Check for common user inputs
    common_inputs = [
        "Positive|Entertainment",
        "Happy|Entertainment", 
        "Good|Entertainment",
        "Neutral|Entertainment",
        "Positive|Relaxation",
        "Negative|Entertainment"
    ]
    
    print("\nCommon user input coverage:")
    for input_type in common_inputs:
        matching_contexts = [k for k in bandit_stats.keys() if input_type in k]
        print(f"  {input_type}: {len(matching_contexts)} contexts")

def main():
    """Main function to generate and save enriched training data"""
    print("🚀 Starting Bandit Data Enrichment Process")
    print("=" * 50)
    
    try:
        # Generate comprehensive training data
        bandit_stats = generate_comprehensive_training_data()
        
        # Analyze coverage
        analyze_coverage(bandit_stats)
        
        # Save the enriched data
        save_bandit_stats(bandit_stats)
        
        print("\n🎉 Bandit data enrichment completed successfully!")
        print("\nNext steps:")
        print("1. Restart your backend server")
        print("2. Test recommendations for different moods and intents")
        print("3. The system should now provide diverse recommendations")
        
    except Exception as e:
        print(f"❌ Error during data enrichment: {e}")
        raise

if __name__ == "__main__":
    main() 