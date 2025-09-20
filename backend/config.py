class Config:
    SECRET_KEY = "supersecretkey"
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:root123@localhost/user_management"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "jwtsecretkey"

    # Azure AD SSO
    CLIENT_ID = "your-client-id"
    TENANT_ID = "your-tenant-id"
    CLIENT_SECRET = "your secret key"  # from Certificates & secrets
    AUTHORITY = f"https://login.microsoftonline.com/common"
    REDIRECT_URI = "http://localhost:5000/api/auth/sso/callback"
    SCOPE = ["User.Read"]  # basic profile info

    # Gmail SMTP for Flask-Mail
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = "infotamjit@gmail.com"       # your Gmail address
    MAIL_PASSWORD = "lwlk syej mhdr wnwn"          # ⚡ generate App Password (not your Gmail password!)
    MAIL_DEFAULT_SENDER = ("User Management", "infotamjit@gmail.com")