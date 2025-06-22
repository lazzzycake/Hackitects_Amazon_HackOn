import json
import random
from collections import defaultdict
from sklearn.preprocessing import OneHotEncoder

# ✅ Use relative path to data directory
with open("../data/training_data_bandit.json", 'r') as f:
    data = json.load(f)

# Flatten context for encoding
contexts = [list(d['context'].values()) for d in data]
actions = [d['action'] for d in data]
rewards = [d['reward'] for d in data]

# ✅ One-hot encode the context
encoder = OneHotEncoder(sparse_output=False)  # For scikit-learn >= 1.2, use sparse_output
X_context = encoder.fit_transform(contexts)

# Track rewards per action
action_values = defaultdict(lambda: [0, 0])  # {action: [total_reward, count]}

# ε for exploration in epsilon-greedy
epsilon = 0.2

# ✅ Training: aggregate rewards
for i in range(len(data)):
    action = actions[i]
    reward = rewards[i]
    action_values[action][0] += reward
    action_values[action][1] += 1

# Compute average reward for each action
avg_rewards = {
    a: (total / count if count > 0 else 0)
    for a, (total, count) in action_values.items()
}

# ✅ Simulated new user context
new_context = {
    "mood": "Happy",
    "intent": "Entertainment",
    "weather": "Sunny",
    "time_of_day": "Evening"
}

# One-hot encode the new context
new_x = encoder.transform([[new_context['mood'], new_context['intent'], new_context['weather'], new_context['time_of_day']]])

# Get all available movies (actions)
all_actions = list(avg_rewards.keys())

# ✅ Recommend top 3 using epsilon-greedy
recommendations = []
for _ in range(3):
    if not all_actions:
        break

    if random.random() < epsilon:
        action = random.choice(all_actions)
    else:
        action = max(all_actions, key=avg_rewards.get)

    recommendations.append(action)
    all_actions.remove(action)  # avoid recommending the same movie again

print("🎬 Recommended Movies:", recommendations)
