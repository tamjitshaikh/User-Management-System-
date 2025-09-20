from flask import Blueprint, request, jsonify
from models import db, User
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

routes_bp = Blueprint('routes', __name__, url_prefix='/api')

def admin_required(fn):
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'msg': 'Admin only'}), 403
        return fn(*args, **kwargs)
    return wrapper

# Get all users
@routes_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.order_by(User.id).all()
    return jsonify([u.to_dict() for u in users])

# Admin routes
@routes_bp.route('/admin/users', methods=['POST'])
@jwt_required()
@admin_required
def add_user():
    data = request.json
    if User.query.filter((User.username==data['username']) | (User.email==data['email'])).first():
        return jsonify({'msg':'Username or email exists'}), 400
    user = User(username=data['username'], email=data['email'], role=data.get('role','user'))
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'msg':'User created', 'user':user.to_dict()})

@routes_bp.route('/admin/users/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    if data.get('password'):
        user.set_password(data['password'])
    user.role = data.get('role', user.role)
    db.session.commit()
    return jsonify({'msg':'User updated'})

@routes_bp.route('/admin/users/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'msg':'User deleted'})

# Admin enable/disable user
@routes_bp.route('/admin/users/<int:id>/toggle', methods=['PUT'])
@jwt_required()
@admin_required
def toggle_user(id):
    user = User.query.get_or_404(id)
    user.is_active = not user.is_active  # Toggle the active status
    db.session.commit()
    status = "enabled" if user.is_active else "disabled"
    return jsonify({'msg': f'User {status} successfully', 'user': user.to_dict()})

# Update own profile (username and email only)
@routes_bp.route('/users/me', methods=['PUT'])
@jwt_required()
def update_self():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.json

    # Only allow updating username and email
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    
    db.session.commit()
    return jsonify({'msg': 'Profile updated', 'user': user.to_dict()})
