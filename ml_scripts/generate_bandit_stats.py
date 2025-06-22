import json
from collections import defaultdict

# Load feedback.json
with open("../data/feedback.json", "r") as f:
    feedback_entries = json.load(f)

# Build new stats from user feedback
stats = defaultdict(lambda: {"reward": 0, "count": 0})

for entry in feedback_entries:
    title = entry["movie_title"]
    stats[title]["reward"] += entry["reward"]
    stats[title]["count"] += 1

# Save new stats to bandit_stats.json
with open("../data/bandit_stats.json", "w") as f:
    json.dump(stats, f, indent=2)

print("✅ Done! Updated bandit_stats.json from feedback.json")
