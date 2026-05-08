import os
import uuid
from datetime import datetime

import bcrypt
from flask import Flask, abort, jsonify, redirect, render_template, request, session, url_for
from pymongo import DESCENDING, MongoClient
from bson.objectid import ObjectId
from io import BytesIO

from flask import send_file

from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle
)

from reportlab.lib import colors
ADMIN_PHONE = "22a81a0650"
ADMIN_PASSWORD = "admin123"

app = Flask(__name__)

# Secret key
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

# MongoDB
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("MONGO_DB", "blood_donor_db")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

COL_USERS = "users"
COL_CHATS = "chats"
COL_MESSAGES = "messages"
COL_REQUESTS = "requests"

# Temporary reset tokens
reset_tokens = {}


def utcnow_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def get_user_by_phone(phone: str):
    return db[COL_USERS].find_one({"phone": phone})


def require_login():
    if "user_phone" not in session:
        abort(401)


def format_user_for_search(u: dict):
    return {
        "id": str(u.get("_id")),
        "name": u.get("name"),
        "blood_group": u.get("blood_group"),
        "city": u.get("city"),
        "pincode": u.get("pincode"),
        "available": bool(u.get("available")),
    }


@app.errorhandler(401)
def unauthorized(_e):
    if request.accept_mimetypes.best == "application/json":
        return jsonify({"error": "Unauthorized"}), 401

    return redirect(url_for("login"))


# =========================
# HOME
# =========================

@app.get("/")
def index():
    return render_template("index.html")


# =========================
# REGISTER
# =========================

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "GET":
        return render_template("register.html")

    data = request.form

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""
    blood_group = (data.get("blood_group") or "").strip().upper()
    city = (data.get("city") or "").strip()
    pincode = (data.get("pincode") or "").strip()
    available_raw = (data.get("available") or "").strip().lower()

    errors = []

    if not name:
        errors.append("Full Name is required.")

    if not phone:
        errors.append("Phone Number is required.")

    if not password:
        errors.append("Password is required.")

    if password != confirm_password:
        errors.append("Passwords do not match.")

    if not blood_group:
        errors.append("Blood Group is required.")

    if not city:
        errors.append("City is required.")

    if not pincode:
        errors.append("Pincode is required.")

    available = available_raw in ("1", "true", "yes", "on")

    # Prevent duplicate phone
    if not errors and get_user_by_phone(phone):
        errors.append("Phone number already registered.")

    if errors:
        return render_template("register.html", errors=errors), 400

    hashed = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    db[COL_USERS].insert_one({
        "name": name,
        "phone": phone,
        "password": hashed,
        "blood_group": blood_group,
        "city": city,
        "pincode": pincode,
        "available": available,
        "created_at": utcnow_iso(),
    })

    return redirect(url_for("login"))


# =========================
# LOGIN
# =========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "GET":
        return render_template("login.html")

    phone = (request.form.get("phone") or "").strip()
    password = request.form.get("password") or ""

    if not phone or not password:

        return render_template(
            "login.html",
            error="Phone and password required."
        ), 400


    if phone == ADMIN_PHONE and password == ADMIN_PASSWORD:

        session["admin"] = True

        return redirect("/admin")


    user = get_user_by_phone(phone)

    if not user:

        return render_template(
            "login.html",
            error="Invalid credentials."
        ), 401


    try:

        ok = bcrypt.checkpw(
            password.encode("utf-8"),
            user["password"].encode("utf-8")
        )

    except Exception:

        ok = False


    if not ok:

        return render_template(
            "login.html",
            error="Invalid credentials."
        ), 401


    session["user_phone"] = phone

    return redirect(url_for("dashboard"))

@app.route("/admin")
def admin_dashboard():

    if not session.get("admin"):
        return redirect("/login")

    return render_template("admin.html")
    
@app.route(
    "/admin/add_user",
    methods=["GET", "POST"]
)
def admin_add_user_page():

    if not session.get("admin"):

        return redirect("/login")


    if request.method == "GET":

        return render_template(
            "add_user.html"
        )


    name = request.form.get("name")
    phone = request.form.get("phone")
    password = request.form.get("password")
    blood_group = request.form.get("blood_group")
    city = request.form.get("city")
    pincode = request.form.get("pincode")


    if (
        not name or
        not phone or
        not password or
        not blood_group or
        not city or
        not pincode
    ):

        return redirect(
            "/admin/add_user"
        )


    if not phone.isdigit() or len(phone) != 10:

        return redirect(
            "/admin/add_user"
        )


    if not pincode.isdigit() or len(pincode) != 6:

        return redirect(
            "/admin/add_user"
        )


    if len(password) < 8:

        return redirect(
            "/admin/add_user"
        )


    existing_user = db[COL_USERS].find_one({

        "phone": phone

    })


    if existing_user:

        return redirect(
            "/admin/users"
        )


    hashed_password = bcrypt.hashpw(

        password.encode("utf-8"),

        bcrypt.gensalt()

    ).decode("utf-8")


    db[COL_USERS].insert_one({

        "name": name,

        "phone": phone,

        "password": hashed_password,

        "blood_group": blood_group,

        "city": city,

        "pincode": pincode,

        "available": True

    })


    return redirect("/admin/users")

@app.route("/admin/export_donors_pdf")
def export_donors_pdf():

    if not session.get("admin"):

        return redirect("/login")


    donors = list(
        db[COL_USERS].find({
            "available": True
        })
    )


    buffer = BytesIO()

    pdf = SimpleDocTemplate(buffer)


    data = [[
        "Name",
        "Phone",
        "Blood Group",
        "City",
        "Pincode"
    ]]


    for donor in donors:

        data.append([

            donor.get("name", ""),

            donor.get("phone", ""),

            donor.get("blood_group", ""),

            donor.get("city", ""),

            donor.get("pincode", "")

        ])


    table = Table(data)


    table.setStyle(TableStyle([

        (
            "BACKGROUND",
            (0, 0),
            (-1, 0),
            colors.red
        ),

        (
            "TEXTCOLOR",
            (0, 0),
            (-1, 0),
            colors.white
        ),

        (
            "GRID",
            (0, 0),
            (-1, -1),
            1,
            colors.black
        ),

        (
            "FONTNAME",
            (0, 0),
            (-1, 0),
            "Helvetica-Bold"
        ),

        (
            "BOTTOMPADDING",
            (0, 0),
            (-1, 0),
            12
        )

    ]))


    pdf.build([table])

    buffer.seek(0)


    return send_file(

        buffer,

        as_attachment=True,

        download_name="donors.pdf",

        mimetype="application/pdf"
    )


@app.route(
    "/admin/delete_user/<user_id>",
    methods=["POST"]
)
def admin_delete_user(user_id):

    if not session.get("admin"):

        return jsonify({
            "success": False
        })

    try:

        db[COL_USERS].delete_one({
            "_id": ObjectId(user_id)
        })

        return jsonify({
            "success": True
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False
        })
    
@app.route("/admin/users")
def admin_users():

    if not session.get("admin"):
        return redirect("/login")

    users = list(
        db[COL_USERS].find()
    )

    return render_template(
        "admin_users.html",
        users=users
    )


@app.route("/admin/donors")
def admin_donors():

    if not session.get("admin"):

        return redirect("/login")


    donors = list(

        db[COL_USERS].find({
            "available": True
        })

    )


    total_donors = db[COL_USERS].count_documents({

        "available": True

    })


    o_positive = db[COL_USERS].count_documents({

        "available": True,

        "blood_group": "O+"

    })


    a_positive = db[COL_USERS].count_documents({

        "available": True,

        "blood_group": "A+"

    })


    b_positive = db[COL_USERS].count_documents({

        "available": True,

        "blood_group": "B+"

    })


    return render_template(

        "admin_donors.html",

        donors=donors,

        total_donors=total_donors,

        o_positive=o_positive,

        a_positive=a_positive,

        b_positive=b_positive

    )

@app.route("/admin/requests")
def admin_requests():

    if not session.get("admin"):

        return redirect("/login")


    requests_data = list(

        db["requests"].find()

    )


    return render_template(

        "admin_requests.html",

        requests_data=requests_data

    )

@app.route("/admin/chats")
def admin_chats():

    if not session.get("admin"):
        return redirect("/login")

    return "<h1>Chats Page</h1>"
# =========================
# LOGOUT
# =========================

@app.get("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


# =========================
# FORGOT PASSWORD
# =========================

@app.route("/forgot_password", methods=["GET", "POST"])
def forgot_password():

    if request.method == "GET":
        return render_template("forgot_password.html")

    phone = (request.form.get("phone") or "").strip()

    if not phone:
        return render_template(
            "forgot_password.html",
            error="Phone number required."
        ), 400

    user = get_user_by_phone(phone)

    if not user:
        return render_template(
            "forgot_password.html",
            error="No account found."
        ), 404

    token = str(uuid.uuid4())

    reset_tokens[token] = phone

    return redirect(url_for("reset_password", token=token))


@app.route("/reset_password/<token>", methods=["GET", "POST"])
def reset_password(token):

    phone = reset_tokens.get(token)

    if not phone:
        return render_template(
            "reset_password.html",
            token=token,
            error="Invalid or expired token."
        ), 400

    if request.method == "GET":
        return render_template(
            "reset_password.html",
            token=token
        )

    password = request.form.get("password") or ""
    confirm_password = request.form.get("confirm_password") or ""

    if not password:
        return render_template(
            "reset_password.html",
            token=token,
            error="Password required."
        ), 400

    if password != confirm_password:
        return render_template(
            "reset_password.html",
            token=token,
            error="Passwords do not match."
        ), 400

    hashed = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    db[COL_USERS].update_one(
        {"phone": phone},
        {"$set": {"password": hashed}}
    )

    reset_tokens.pop(token, None)

    return redirect(url_for("login"))


# =========================
# DASHBOARD
# =========================

@app.route("/dashboard")
def dashboard():

    require_login()

    user = get_user_by_phone(session["user_phone"])

    if not user:
        return redirect(url_for("login"))

    return render_template(
        "dashboard.html",
        user={
            "name": user.get("name"),
            "blood_group": user.get("blood_group"),
            "city": user.get("city"),
            "pincode": user.get("pincode"),
            "available": bool(user.get("available")),
            "phone": user.get("phone"),
        },
    )


# =========================
# PROFILE
# =========================

@app.route("/profile", methods=["GET", "POST"])
def profile():

    require_login()

    user = get_user_by_phone(session["user_phone"])

    if not user:
        return redirect(url_for("login"))

    if request.method == "GET":

        return render_template(
            "profile.html",
            profile={
                "name": user.get("name"),
                "blood_group": user.get("blood_group"),
                "city": user.get("city"),
                "pincode": user.get("pincode"),
                "available": bool(user.get("available")),
            },
        )

    data = request.form

    name = (data.get("name") or "").strip()
    blood_group = (data.get("blood_group") or "").strip().upper()
    city = (data.get("city") or "").strip()
    pincode = (data.get("pincode") or "").strip()
    available_raw = (data.get("available") or "").strip().lower()

    available = available_raw in ("1", "true", "yes", "on")

    db[COL_USERS].update_one(
        {"phone": session["user_phone"]},
        {
            "$set": {
                "name": name,
                "blood_group": blood_group,
                "city": city,
                "pincode": pincode,
                "available": available,
            }
        },
    )

    return redirect(url_for("profile"))


# =========================
# DONORS API
# =========================

@app.get("/api/recent_donors")
def api_recent_donors():

    require_login()

    limit = int(request.args.get("limit", "8"))

    donors = list(
        db[COL_USERS]
        .find({"phone": {"$ne": session["user_phone"]}})
        .sort("created_at", DESCENDING)
        .limit(limit)
    )

    donors = [d for d in donors if d.get("available")]

    return jsonify({
        "donors": [format_user_for_search(d) for d in donors]
    })


@app.get("/api/search_donors")
def api_search_donors():

    require_login()

    blood_group = (request.args.get("blood_group") or "").strip().upper()
    city = (request.args.get("city") or "").strip()
    pincode = (request.args.get("pincode") or "").strip()

    q = {
        "phone": {"$ne": session["user_phone"]},
        "available": True
    }

    if blood_group:
        q["blood_group"] = blood_group

    if city:
        q["city"] = {
            "$regex": city,
            "$options": "i"
        }

    if pincode:
        q["pincode"] = pincode

    donors = list(
        db[COL_USERS].find(q).limit(20)
    )

    return jsonify({
        "donors": [format_user_for_search(d) for d in donors]
    })


# =========================
# CHAT
# =========================

@app.route("/chat/<chat_id>")
def chat(chat_id):

    require_login()

    return render_template(
        "chat.html",
        chat_id=chat_id
    )


@app.post("/api/create_chat")
def api_create_chat():

    require_login()

    payload = request.get_json(force=True)

    receiver_id = payload.get("receiver_id")

    if not receiver_id:
        return jsonify({
            "error": "receiver_id required"
        }), 400

    sender_phone = session["user_phone"]

    sender = db[COL_USERS].find_one(
        {"phone": sender_phone},
        {"_id": 1}
    )

    if not sender:
        return jsonify({
            "error": "Sender not found"
        }), 401

    receiver = db[COL_USERS].find_one(
        {"_id": ObjectId(receiver_id)},
        {"_id": 1}
    )

    if not receiver:
        return jsonify({
            "error": "Receiver not found"
        }), 404

    sender_id = str(sender["_id"])
    receiver_id = str(receiver["_id"])

    # Existing chat check
    existing_chat = db[COL_CHATS].find_one({
        "$or": [
            {
                "sender_id": sender_id,
                "receiver_id": receiver_id
            },
            {
                "sender_id": receiver_id,
                "receiver_id": sender_id
            }
        ]
    })

    # Use existing chat
    if existing_chat:
        return jsonify({
            "chat_id": existing_chat["chat_id"]
        })

    # Create new chat
    chat_id = str(uuid.uuid4())

    db[COL_CHATS].insert_one({
        "chat_id": chat_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "created_at": utcnow_iso(),
    })

    return jsonify({
        "chat_id": chat_id
    })


@app.post("/send_message")
def send_message():

    require_login()

    payload = request.get_json(force=True)

    chat_id = payload.get("chat_id")
    message = (payload.get("message") or "").strip()

    if not chat_id or not message:
        return jsonify({
            "error": "chat_id and message required"
        }), 400

    sender_phone = session["user_phone"]

    sender = db[COL_USERS].find_one(
        {"phone": sender_phone},
        {"_id": 1, "name": 1}
    )

    if not sender:
        return jsonify({
            "error": "Sender not found"
        }), 401

    db[COL_MESSAGES].insert_one({

    "chat_id": chat_id,

    "sender":
        sender.get("name") or "User",

    "sender_phone":
        sender_phone,

    "message":
        message,

    "timestamp":
        utcnow_iso(),
})

    return jsonify({
        "ok": True
    })


@app.get("/get_messages")
def get_messages():

    require_login()

    chat_id = request.args.get("chat_id")

    if not chat_id:
        return jsonify({
            "messages": []
        })

    msgs = list(
        db[COL_MESSAGES]
        .find({"chat_id": chat_id})
        .sort("timestamp", DESCENDING)
        .limit(50)
    )

    msgs.reverse()

    return jsonify({

    "messages": [

        {

            "sender":
                m.get("sender"),

            "sender_phone":
                m.get("sender_phone"),

            "message":
                m.get("message"),

            "timestamp":
                m.get("timestamp"),

        }

        for m in msgs
    ]
})

@app.route(
    '/api/update_availability',
    methods=['POST']
)
def update_availability():

    require_login()

    data = request.get_json()

    available = bool(
        data.get('available')
    )

    db[COL_USERS].update_one(
        {
            "phone": session["user_phone"]
        },
        {
            "$set": {
                "available": available
            }
        }
    )

    return jsonify({
        "success": True
    })
@app.get("/api/my_chats")
def my_chats():

    require_login()

    user = get_user_by_phone(session["user_phone"])

    if not user:
        return jsonify({"chats": []})

    my_id = str(user["_id"])

    chats = list(
        db[COL_CHATS].find({
            "$or": [
                {"sender_id": my_id},
                {"receiver_id": my_id}
            ]
        })
    )

    result = []

    for c in chats:

        other_id = (
            c["receiver_id"]
            if c["sender_id"] == my_id
            else c["sender_id"]
        )

        other_user = db[COL_USERS].find_one({
            "_id": ObjectId(other_id)
        })

        if not other_user:
            continue

        last_message = db[COL_MESSAGES].find_one(
            {"chat_id": c["chat_id"]},
            sort=[("timestamp", -1)]
        )

        result.append({
            "chat_id": c["chat_id"],
            "name": other_user.get("name"),
            "last_message": (
                last_message.get("message")
                if last_message else "No messages yet"
            )
        })

    return jsonify({
        "chats": result
    })

@app.route("/requests")
def requests_page():

    require_login()

    user = get_user_by_phone(
        session["user_phone"]
    )

    return render_template(
        "requests.html",
        user=user
    )

# =========================
# BLOOD REQUESTS
# =========================

@app.post("/api/create_request")
def create_request():

    require_login()

    data = request.get_json()

    request_doc = {

        "name":
            data.get("name"),

        "blood_group":
            data.get("blood_group"),

        "units":
            data.get("units"),

        "hospital":
            data.get("hospital"),

        "city":
            data.get("city"),

        "phone":
            data.get("phone"),

        "status":
            "pending"
    }

    result = db[COL_REQUESTS].insert_one(
        request_doc
    )

    return jsonify({

        "success": True,

        "id": str(result.inserted_id)

    })

@app.route("/clear_requests")
def clear_requests():

    db[COL_REQUESTS].delete_many({})

    return "All requests deleted"

@app.get("/api/get_requests")
def get_requests():

    require_login()

    requests_data = list(
        db[COL_REQUESTS]
        .find({
            "status": "pending"
        })
        .sort("created_at", -1)
    )

    output = []

    for r in requests_data:

        output.append({

            "id":
                str(r["_id"]),

            "patient_name":
                r.get("name"),

            "blood_group":
                r.get("blood_group"),

            "units":
                r.get("units"),

            "hospital":
                r.get("hospital"),

            "city":
                r.get("city"),

            "phone":
                r.get("phone"),

            "status":
                r.get("status", "pending"),

            "created_at":
                r.get("created_at"),

            "expires_at":
                r.get("expires_at"),

            "is_owner":
                r.get("created_by")
                == session["user_phone"]
        })

    return jsonify({
        "requests": output
    })


@app.post("/api/resolve_request/<request_id>")
def resolve_request(request_id):

    require_login()

    db[COL_REQUESTS].update_one(
        {
            "_id": ObjectId(request_id)
        },
        {
            "$set": {
                "status": "resolved"
            }
        }
    )

    return jsonify({
        "success": True
    })

@app.route("/chats")
def chats_page():

    require_login()

    return render_template(
        "chats.html"
    )
# =========================
# MAIN
# =========================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=True
    )