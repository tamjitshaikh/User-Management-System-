import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./dashboard.css";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; // change as needed

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Logout
  function handleLogout() {
    localStorage.clear();
    window.history.replaceState(null, "", "/");
    navigate("/");
  }

  // Fetch users
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetch("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.users)) setUsers(data.users);
        else if (Array.isArray(data)) setUsers(data);
        else setUsers([]);
      })
      .catch(console.error);
  }, [token, navigate]);

  // Toggle Active Status
  async function toggleActive(user) {
    const res = await fetch(`http://localhost:5000/api/admin/users/${user.id}/toggle`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((u) =>
        u.map((x) => (x.id === user.id ? { ...x, is_active: data.user.is_active } : x))
      );
    } else {
      alert(data.msg || "Failed to toggle status");
    }
  }

  // Delete user
  async function deleteUser(id) {
    if (!window.confirm("Delete user?")) return;
    const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setUsers((u) => u.filter((x) => x.id !== id));
    else {
      const data = await res.json();
      alert(data.msg || "Delete failed");
    }
  }

  // Save update
  async function saveUpdate(e) {
    e.preventDefault();
    let url = `http://localhost:5000/api/users/me`;
    let bodyData = { username: editingUser.username, email: editingUser.email };

    if (user.role === "admin" && editingUser.id !== user.id) {
      url = `http://localhost:5000/api/admin/users/${editingUser.id}`;
      bodyData = { ...editingUser };
    }

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();

    if (res.ok) {
      setUsers((u) =>
        u.map((x) => (x.id === editingUser.id ? { ...x, ...bodyData } : x))
      );
      alert(data.msg || "User updated successfully");

      const modal = window.bootstrap.Modal.getInstance(document.getElementById("updateModal"));
      if (modal) modal.hide();

      setEditingUser(null);

      if (editingUser.id === user.id) {
        localStorage.setItem("user", JSON.stringify({ ...user, ...bodyData }));
      }
    } else {
      alert(data.msg || "Update failed");
    }
  }

  // Add User (Admin only)
  async function addUser(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newUser = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    };

    const res = await fetch("http://localhost:5000/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newUser),
    });

    const data = await res.json();
    if (res.ok && data.user) {
      setUsers([data.user, ...users]);
      e.target.reset();
    } else {
      alert(data.msg || "Failed to add user");
    }
  }

  // Self-edit handler (from Navbar)
  function handleEditSelf(userData) {
    setEditingUser(userData);
    const modalEl = document.getElementById("updateModal");
    const modal = new window.bootstrap.Modal(modalEl);
    modal.show();
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Stats
  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === "admin").length;
  const regularUsers = users.filter((u) => u.role === "user").length;
  const activeNow = users.filter((u) => u.is_active).length;

  return (
    <div className="px-0">
      <Navbar user={user} onLogout={handleLogout} onEditSelf={handleEditSelf} />
  {/* Header */}  
      <div className="dashboard-header w-100 p-5 mb-4 rounded text-white">
  <h2 className="fw-bold">
    {user.role === "admin"
      ? "Admin Dashboard"
      : user.role === "user"
      ? "User Dashboard"
      : "Dashboard"}
  </h2>
  <p>
    Welcome back, {user.username || "Guest"}!{" "}
    {user.role === "admin"
      ? "You have full administrative access to the system."
      : user.role === "user"
      ? "You have standard user access."
      : "You are logged in."}
  </p>
</div>

      <div className="container mt-5 pt-4 pb-5 mb-5">
        {/* Stats Cards */}
        <div className="row mb-4 pb-5">
          <div className="col-md-3">
            <div className="stat-card d-flex align-items-center">
              <div className="icon-box bg-primary text-white me-3">
                <i className="bi bi-people"></i>
              </div>
              <div>
                <h6>Total Users</h6>
                <h3>{totalUsers}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card  d-flex align-items-center">
              <div className="icon-box bg-danger text-white me-3">
                <i className="bi bi-shield-lock"></i>
              </div>
              <div>
                <h6>Admin Users</h6>
                <h3>{adminUsers}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card  d-flex align-items-center">
              <div className="icon-box bg-success text-white me-3">
                <i className="bi bi-person"></i>
              </div>
              <div>
                <h6>Regular Users</h6>
                <h3>{regularUsers}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card  d-flex align-items-center">
              <div className="icon-box bg-warning text-white me-3">
                <i className="bi bi-activity"></i>
              </div>
              <div>
                <h6>Active Now</h6>
                <h3>{activeNow}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Add User Form */}
        {user.role === "admin" && (
<div
  className="card mb-4"
  style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.8)" }}
>
            <div className="card-body">
              <h5 className="card-title">Add User</h5>
              <form className="row g-2 align-items-center" onSubmit={addUser}>
                <div className="col-md-3">
                  <input name="username" className="form-control" placeholder="Username" required />
                </div>
                <div className="col-md-3">
                  <input name="email" type="email" className="form-control" placeholder="Email" required />
                </div>
                <div className="col-md-3">
                  <input name="password" type="password" className="form-control" placeholder="Password" required />
                </div>
                <div className="col-md-2">
                  <select name="role" className="form-select">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <button className="btn btn-primary w-100" type="submit">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="search">

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold"><i className="bi bi-people me-2"></i>All Users</h4>
            <div className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <table className="table table-striped table-bordered align-middle rounded-table">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    {user.role === "admin" && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length > 0 ? currentUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "bg-danger" : "bg-primary"}`}>{u.role}</span>
                      </td>
                      <td className="text-center">
                        {user.role === "admin" ? (
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={u.is_active}
                              onChange={() => toggleActive(u)}
                            />
                            <span className="slider round"></span>
                          </label>
                        ) : (
                          <span>{u.is_active ? "Active" : "Inactive"}</span>
                        )}
                      </td>

                      {user.role === "admin" && (
                        <td>
                          <button className="btn btn-sm btn-warning me-2" data-bs-toggle="modal" data-bs-target="#updateModal" onClick={() => setEditingUser(u)}>Update</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.id)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={user.role === "admin" ? 6 : 5} className="text-center">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="d-flex justify-content-center mt-3">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)}>Previous</button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => paginate(currentPage + 1)}>Next</button>
                    </li>
                  </ul>
                </nav>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Update / Self Profile Modal */}
      <div className="modal fade" id="updateModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content shadow-lg border-0">
            <form onSubmit={saveUpdate}>
              <div
  className="modal-header text-white"
  style={{ background: "linear-gradient(90deg, #dc3545, #b259d5)" }}
>
                <h5 className="modal-title">{editingUser?.id === user.id ? "My Profile" : "Update User"}</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body bg-light">
                {editingUser && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        required
                      />
                    </div>

                    {/* Admin-only fields */}
                    {user.role === "admin" && editingUser.id !== user.id && (
                      <>
                        <div className="col-md-6">
                          <input
                            type="password"
                            className="form-control"
                            placeholder="New password (optional)"
                            onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <select
                            className="form-select"
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light">
                <button type="submit" className="btn btn-success">Save</button>
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
