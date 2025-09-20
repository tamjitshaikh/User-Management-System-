from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, User
from config import Config
from auth import auth_bp
from routes import routes_bp
from flask_mail import Mail

mail = Mail()
app = Flask(__name__)
app.config.from_object(Config)

mail.init_app(app)
# Required for session
app.secret_key = Config.SECRET_KEY

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(routes_bp)

# ✅ Create default admin
def create_default_admin():
    admin = User.query.filter_by(username="admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@example.com",
            role="admin",
            is_active=True
        )
        admin.set_password("admin123")  # Default password
        db.session.add(admin)
        db.session.commit()
        print("✅ Default admin created: username=admin, password=admin123")


# ✅ Application entry point
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        create_default_admin()
    app.run(debug=True, port=5000)
