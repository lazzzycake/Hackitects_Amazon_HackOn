import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# ✅ Get absolute path to serviceAccountKey.json in the parent backend directory
cred_path = os.path.join(os.path.dirname(__file__), "../backend/serviceAccountKey.json")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

def clear_collection(collection_name):
    """Delete all documents in a collection"""
    print(f"🗑️ Clearing collection '{collection_name}'...")
    docs = db.collection(collection_name).stream()
    deleted_count = 0
    for doc in docs:
        doc.reference.delete()
        deleted_count += 1
    print(f"✅ Deleted {deleted_count} documents from '{collection_name}'")

# ✅ Load JSON from inside backend/
def upload_json_to_firestore(filename, collection_name, clear_first=True):
    json_path = os.path.join(os.path.dirname(__file__), filename)
    
    print(f"\nAttempting to upload '{filename}' to collection '{collection_name}'...")
    
    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        return

    # Clear collection first if requested
    if clear_first:
        clear_collection(collection_name)

    with open(json_path, "r") as file:
        try:
            data = json.load(file)
            if not data:
                print(f"⚠️ File '{filename}' is empty. Nothing to upload.")
                return
        except json.JSONDecodeError:
            print(f"❌ Error decoding JSON from '{filename}'. Please check its format.")
            return

    for idx, entry in enumerate(data):
        # Use a more meaningful document ID if available, otherwise use index
        doc_id = entry.get("title", entry.get("movie_title", str(idx)))
        doc_ref = db.collection(collection_name).document(doc_id)
        doc_ref.set(entry)
        # Don't print for every single document to avoid spamming the console
        # print(f"✅ Uploaded document '{doc_id}' to collection '{collection_name}'")

    print(f"✅ Successfully uploaded {len(data)} documents from '{filename}'.")

def upload_bandit_stats():
    """Upload bandit_stats.json to Firestore"""
    json_path = os.path.join(os.path.dirname(__file__), "../data/bandit_stats.json")
    
    print(f"\nAttempting to upload 'bandit_stats.json' to collection 'bandit_stats'...")
    
    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        return

    # Clear existing bandit_stats collection
    clear_collection("bandit_stats")

    with open(json_path, "r") as file:
        try:
            data = json.load(file)
            if not data:
                print(f"⚠️ File 'bandit_stats.json' is empty. Nothing to upload.")
                return
        except json.JSONDecodeError:
            print(f"❌ Error decoding JSON from 'bandit_stats.json'. Please check its format.")
            return

    # Upload each context as a separate document
    for context_key, movies_data in data.items():
        doc_ref = db.collection("bandit_stats").document(context_key)
        doc_ref.set(movies_data)

    print(f"✅ Successfully uploaded {len(data)} context documents from 'bandit_stats.json'.")

# ✅ Upload all files with clean slate
upload_json_to_firestore("../data/movies.json", "movies", clear_first=True)
upload_json_to_firestore("../data/feedback.json", "feedback", clear_first=True)
upload_bandit_stats()

print("\n🎉 All requested uploads finished!")
print("📊 Summary:")
print("   - movies collection: Updated with latest movies")
print("   - feedback collection: Updated with latest feedback")
print("   - bandit_stats collection: Updated with latest recommendation statistics")
