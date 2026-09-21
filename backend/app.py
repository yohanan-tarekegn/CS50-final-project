import os
import secrets
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from cs50 import SQL

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "gatherround_super_secret_key")

# Enable CORS for React frontend requests
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5173", "http://localhost:5173"])

# Initialize CS50 SQL database connection
db = SQL("sqlite:///gatherround.db")

# Automatically initialize DB tables using schema.sql
with app.app_context():
    if os.path.exists("schema.sql"):
        with open("schema.sql", "r") as f:
            statements = f.read().split(";")
            for statement in statements:
                if statement.strip():
                    db.execute(statement)

# -------------------------------------------------------------------
# AUTHENTICATION ENDPOINTS
# -------------------------------------------------------------------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    existing_user = db.execute("SELECT id FROM users WHERE username = ?", username)
    if existing_user:
        return jsonify({"error": "Username already taken"}), 400

    password_hash = generate_password_hash(password)
    user_id = db.execute(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        username,
        password_hash
    )

    session["user_id"] = user_id
    return jsonify({"id": user_id, "username": username}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    rows = db.execute("SELECT * FROM users WHERE username = ?", username)
    if not rows or not check_password_hash(rows[0]["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"] = rows[0]["id"]
    return jsonify({"id": rows[0]["id"], "username": rows[0]["username"]}), 200


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/me", methods=["GET"])
def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"user": None}), 200

    rows = db.execute("SELECT id, username FROM users WHERE id = ?", user_id)
    if not rows:
        return jsonify({"user": None}), 200

    return jsonify({"user": rows[0]}), 200


# -------------------------------------------------------------------
# EVENT & POLL ENDPOINTS
# -------------------------------------------------------------------

@app.route("/api/events", methods=["POST"])
def create_event():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    options = data.get("options", [])

    if not title or not options or len(options) < 2:
        return jsonify({"error": "Title and at least two voting options required"}), 400

    share_code = secrets.token_urlsafe(8)

    event_id = db.execute(
        "INSERT INTO events (title, description, creator_id, share_code) VALUES (?, ?, ?, ?)",
        title, description, user_id, share_code
    )

    for opt_text in options:
        if opt_text.strip():
            db.execute("INSERT INTO options (event_id, option_text) VALUES (?, ?)", event_id, opt_text.strip())

    return jsonify({"event_id": event_id, "share_code": share_code}), 201


@app.route("/api/events/<share_code>", methods=["GET"])
def get_event(share_code):
    events = db.execute(
        "SELECT events.id, events.title, events.description, events.share_code, users.username as creator "
        "FROM events JOIN users ON events.creator_id = users.id WHERE share_code = ?",
        share_code
    )
    if not events:
        return jsonify({"error": "Event not found"}), 404

    event = events[0]
    options = db.execute("SELECT id, option_text FROM options WHERE event_id = ?", event["id"])

    user_id = session.get("user_id")

    for opt in options:
        vote_count = db.execute("SELECT COUNT(*) as count FROM votes WHERE option_id = ?", opt["id"])[0]["count"]
        opt["votes"] = vote_count
        
        user_voted = False
        if user_id:
            user_vote = db.execute("SELECT id FROM votes WHERE option_id = ? AND user_id = ?", opt["id"], user_id)
            user_voted = len(user_vote) > 0
        opt["user_voted"] = user_voted

    event["options"] = options
    return jsonify(event), 200


@app.route("/api/vote", methods=["POST"])
def cast_vote():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in to vote."}), 401

    data = request.get_json() or {}
    option_id = data.get("option_id")

    if not option_id:
        return jsonify({"error": "Option ID required"}), 400

    existing = db.execute("SELECT id FROM votes WHERE option_id = ? AND user_id = ?", option_id, user_id)

    if existing:
        db.execute("DELETE FROM votes WHERE option_id = ? AND user_id = ?", option_id, user_id)
        return jsonify({"action": "removed"}), 200
    else:
        db.execute("INSERT INTO votes (option_id, user_id) VALUES (?, ?)", option_id, user_id)
        return jsonify({"action": "added"}), 201


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)