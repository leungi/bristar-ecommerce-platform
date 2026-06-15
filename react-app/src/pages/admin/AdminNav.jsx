import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminAuth } from "../../services/adminApi";

export default function AdminNav({ admin }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    padding: "10px 14px",
    borderRadius: 8,
    textDecoration: "none",
    color: isActive(path) ? "#fff" : "#222",
    background: isActive(path) ? "#111" : "transparent",
    fontWeight: 600,
  });

  return (
    <div
      style={{
        borderBottom: "1px solid #e5e5e5",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, marginRight: 8 }}>
            Admin Dashboard
          </div>

          <Link to="/admin" style={linkStyle("/admin")}>
            Products
          </Link>

          <Link to="/admin/brands" style={linkStyle("/admin/brands")}>
            Brands
          </Link>

          {admin?.role === "super" && (
            <Link to="/admin/users" style={linkStyle("/admin/users")}>
              Manage Admins
            </Link>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 14, color: "#666" }}>
            {admin?.name || admin?.email} {admin?.role ? `(${admin.role})` : ""}
          </div>

          <button
            onClick={async () => {
              await adminAuth.logout();
              navigate("/admin/login");
              window.location.reload();
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
