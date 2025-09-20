from flask import Blueprint, request, jsonify, redirect, session
from models import db, User
from flask_jwt_extended import create_access_token
from config import Config
import msal, uuid, secrets, json
from urllib.parse import quote
from extensions import mail 

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ---------------- Normal Login ----------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "Invalid username"}), 401

    if not user.check_password(password):
        return jsonify({"msg": "Invalid password"}), 401

    if not user.is_active:
        return jsonify({"msg": "User is disabled"}), 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    return jsonify({"access_token": access_token, "user": user.to_dict()})


# ---------------- SSO Login (Azure AD) ----------------
def _build_msal_app(cache=None):
    return msal.ConfidentialClientApplication(
        Config.CLIENT_ID,
        authority=Config.AUTHORITY,
        client_credential=Config.CLIENT_SECRET,
        token_cache=cache
    )

@auth_bp.route("/sso/login")
def sso_login():
    session["state"] = str(uuid.uuid4())
    auth_url = _build_msal_app().get_authorization_request_url(
        scopes=Config.SCOPE,
        state=session["state"],
        redirect_uri=Config.REDIRECT_URI
    )
    return redirect(auth_url)

@auth_bp.route("/sso/callback")
def sso_callback():
    if request.args.get("state") != session.get("state"):
        return jsonify({"msg": "State mismatch"}), 400

    code = request.args.get("code")
    if not code:
        return jsonify({"msg": "Missing authorization code"}), 400

    result = _build_msal_app().acquire_token_by_authorization_code(
        code,
        scopes=Config.SCOPE,
        redirect_uri=Config.REDIRECT_URI
    )

    if "error" in result:
        return jsonify(result), 400

    # Extract user info
    user_email = result.get("id_token_claims", {}).get("preferred_username")
    user_name = result.get("id_token_claims", {}).get("name")

    # Find or create user
    user = User.query.filter_by(email=user_email).first()
    if not user:
        user = User(username=user_name, email=user_email, role="user", is_active=True)
        user.set_password("sso_login")
        db.session.add(user)
        db.session.commit()

    if not user.is_active:
        return jsonify({"msg": "User is disabled"}), 403

    # Issue JWT
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    # Encode user info
    user_data = json.dumps(user.to_dict())
    encoded_user = quote(user_data)

    frontend_url = f"http://localhost:5173/sso-success?token={access_token}&user={encoded_user}"
    return redirect(frontend_url)


# ---------------- Forgot Password (Send OTP) ----------------
from flask_mail import Message
import random, datetime

# Temporary in-memory storage (use Redis/DB in production)
otp_store = {}

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.get("email")
    if not email:
        return jsonify({"msg": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "Email not found"}), 404

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {"otp": otp, "expires": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)}

    # Send OTP via email
    msg = Message("Password Reset OTP", sender="noreply@example.com", recipients=[email])
    msg.body = f"""
Hi {user.username},

We received a request to reset your password for the User Management System.

Your One-Time Password (OTP) is:

🔑 {otp}

Please enter this OTP on the reset password page. 
This OTP is valid for a single use only.

If you did not request a password reset, you can safely ignore this email.

Best regards,  
User Management System Team
        """ 
    mail.send(msg)

    return jsonify({"msg": "OTP sent to your email"})


# ---------------- Verify OTP ----------------
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")

    if not all([email, otp]):
        return jsonify({"msg": "Email and OTP are required"}), 400

    record = otp_store.get(email)
    if not record or record["otp"] != otp:
        return jsonify({"msg": "Invalid OTP"}), 400

    if datetime.datetime.utcnow() > record["expires"]:
        return jsonify({"msg": "OTP expired"}), 400

    # Generate reset token (short-lived)
    reset_token = secrets.token_urlsafe(16)
    user = User.query.filter_by(email=email).first()
    user.reset_token = reset_token
    db.session.commit()

    # Delete OTP once verified
    otp_store.pop(email, None)

    return jsonify({"msg": "OTP verified", "reset_token": reset_token})


# ---------------- Reset Password ----------------
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json
    email = data.get("email")
    token = data.get("reset_token")
    new_password = data.get("password")

    if not all([email, token, new_password]):
        return jsonify({"msg": "Email, token, and password are required"}), 400

    user = User.query.filter_by(email=email, reset_token=token).first()
    if not user:
        return jsonify({"msg": "Invalid email or token"}), 400

    user.set_password(new_password)
    user.reset_token = None
    db.session.commit()

    return jsonify({"msg": "Password reset successfully"})
