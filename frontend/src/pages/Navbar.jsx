// src/components/Navbar.jsx
import React from "react";

export default function Navbar({ user, onLogout, onEditSelf }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="#">
          Dashboard
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link active" href="#">
                Home
              </a>
            </li>
          </ul>

          {/* User info */}
          <span
            className="navbar-text me-3"
            style={{ cursor: "pointer" }}
            data-bs-toggle="modal"
            data-bs-target="#updateModal"
            onClick={() => onEditSelf(user)}
          >
            {user && user.username ? `Hi, ${user.username}` : "Hi, User"}
          </span>

          <button className="btn btn-outline-danger" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
