import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Trash2,
  Ban,
  RefreshCw,
  ChevronDown,
  X,
  Search,
  Play,
  CheckCircle,
  AlertCircle,
  Crown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "sellers", label: "Sellers", icon: ShieldCheck },
];

const ROLES = ["customer", "seller", "admin"];

const ROLE_COLORS = {
  admin: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  seller: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  customer: "bg-secondary text-muted-foreground",
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div className={`border rounded-2xl p-6 ${accent || "border-foreground/10"}`}>
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
      {label}
    </p>
    <p className="text-4xl font-black">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

// ─── Confirm modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
    <div className="relative bg-background border border-foreground/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
      <p className="text-sm font-medium mb-6 text-center">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 border border-foreground/20 rounded-md py-2.5 text-sm font-medium hover:bg-secondary/60 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-600 text-white rounded-md py-2.5 text-sm font-bold hover:bg-red-700 transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null); // { message, action }
  const [roleDropdown, setRoleDropdown] = useState(null); // userId with open dropdown
  const [banReason, setBanReason] = useState("");
  const [banTarget, setBanTarget] = useState(null); // user to ban

  // ── Fetch all users ──────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/v1/admin/users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      activeTab === "users" ||
      activeTab === "sellers" ||
      activeTab === "overview"
    ) {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // ── Derived lists ────────────────────────────────────────────────────────
  const allUsers = users.filter((u) => u.role === "customer");
  const sellers = users.filter((u) => u.role === "seller");
  const admins = users.filter((u) => u.role === "admin");
  const banned = users.filter((u) => u.isBanned);
  const activeList = users.filter((u) => u.isActive && !u.isBanned);

  const displayList = (activeTab === "sellers" ? sellers : allUsers).filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleDelete = (userId, name) => {
    setConfirm({
      message: `Permanently remove "${name}"? This cannot be undone.`,
      action: async () => {
        try {
          await api.delete(`/v1/admin/users/${userId}`);
          setUsers((prev) => prev.filter((u) => u._id !== userId));
        } catch (err) {
          setError(err.message);
        }
        setConfirm(null);
      },
    });
  };

  const handleBan = (u) => {
    if (u.isBanned) {
      // Unban immediately
      setConfirm({
        message: `Unban "${u.name}"?`,
        action: async () => {
          try {
            const data = await api.put(`/v1/admin/users/${u._id}/ban`, {
              isBanned: false,
            });
            setUsers((prev) =>
              prev.map((x) => (x._id === u._id ? data.user : x)),
            );
          } catch (err) {
            setError(err.message);
          }
          setConfirm(null);
        },
      });
    } else {
      setBanTarget(u);
    }
  };

  const submitBan = async () => {
    if (!banTarget) return;
    try {
      const data = await api.put(`/v1/admin/users/${banTarget._id}/ban`, {
        isBanned: true,
        banReason: banReason || "Policy violation",
      });
      setUsers((prev) =>
        prev.map((x) => (x._id === banTarget._id ? data.user : x)),
      );
    } catch (err) {
      setError(err.message);
    }
    setBanTarget(null);
    setBanReason("");
  };

  const handleRoleChange = async (userId, newRole) => {
    setRoleDropdown(null);
    try {
      // Role change via profile update — uses PUT /me/update but for admin
      // Since the API doesn't have a dedicated role-change endpoint, we call
      // a direct DB update through the ban endpoint workaround or just optimistic UI
      // NOTE: Tell backend teammate to add PUT /admin/users/:id/role
      // For now we update locally and show a note
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
      );
      // TODO: await api.put(`/v1/user/admin/users/${userId}/role`, { role: newRole });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[240px] border-r border-foreground/10 p-6 shrink-0">
        <Link to="/" className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full border-2 border-foreground flex items-center justify-center">
            <Play className="w-3 h-3 fill-foreground" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest">
            Admin
          </span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                activeTab === id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-foreground/10 pt-5 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-foreground/10">
          <span className="text-sm font-black uppercase tracking-widest">
            Admin Panel
          </span>
          <div className="flex gap-2">
            {NAV.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`p-2 rounded-md transition-colors ${activeTab === id ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-6xl">
          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError("")} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div>
              <h1
                className="text-3xl font-black uppercase mb-1"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Overview
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                Welcome back, {user?.name}
              </p>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-foreground/10 rounded-2xl p-6 animate-pulse"
                    >
                      <div className="h-3 bg-secondary/40 rounded w-2/3 mb-3" />
                      <div className="h-8 bg-secondary/40 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  <StatCard
                    label="Total Users"
                    value={users.length}
                    sub="All accounts"
                  />
                  <StatCard
                    label="Customers"
                    value={allUsers.length}
                    sub="Role: customer"
                  />
                  <StatCard
                    label="Sellers"
                    value={sellers.length}
                    sub="Active storefronts"
                  />
                  <StatCard
                    label="Banned"
                    value={banned.length}
                    sub="Restricted accounts"
                    accent="border-red-200 dark:border-red-800"
                  />
                </div>
              )}

              {/* Recent users */}
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest mb-4">
                  Recently Joined
                </h2>
                <div className="border border-foreground/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-foreground/10 bg-secondary/20">
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Role
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 5).map((u) => (
                        <tr
                          key={u._id}
                          className="border-b border-foreground/5 hover:bg-secondary/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{u.name}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {u.email}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-full ${ROLE_COLORS[u.role]}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {new Date(u.createdAt).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && !loading && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No users yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── USERS / SELLERS TAB ──────────────────────────────────────── */}
          {(activeTab === "users" || activeTab === "sellers") && (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1
                    className="text-3xl font-black uppercase"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {activeTab === "sellers" ? "Sellers" : "Users"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {displayList.length}{" "}
                    {activeTab === "sellers" ? "seller" : "user"}
                    {displayList.length !== 1 ? "s" : ""}
                    {search ? ` matching "${search}"` : ""}
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="p-2 hover:bg-secondary/60 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-6 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder={`Search ${activeTab}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-secondary/40 rounded-lg pl-10 pr-4 py-2.5 text-sm border-none focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
              </div>

              {/* Table */}
              <div className="border border-foreground/10 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-foreground/10 bg-secondary/20">
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Joined
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-foreground/5">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 bg-secondary/40 rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : displayList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-muted-foreground py-12"
                        >
                          No {activeTab} found.
                        </td>
                      </tr>
                    ) : (
                      displayList.map((u) => (
                        <tr
                          key={u._id}
                          className="border-b border-foreground/5 hover:bg-secondary/20 transition-colors"
                        >
                          {/* Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                              <span className="font-medium truncate max-w-[120px]">
                                {u.name}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">
                            {u.email}
                          </td>

                          {/* Role dropdown */}
                          <td className="px-4 py-3">
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setRoleDropdown(
                                    roleDropdown === u._id ? null : u._id,
                                  )
                                }
                                className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${ROLE_COLORS[u.role]} hover:opacity-80`}
                              >
                                {u.role}
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {roleDropdown === u._id && (
                                <div className="absolute top-full left-0 mt-1 bg-background border border-foreground/10 rounded-lg shadow-xl z-20 overflow-hidden min-w-[110px]">
                                  {ROLES.filter((r) => r !== u.role).map(
                                    (r) => (
                                      <button
                                        key={r}
                                        onClick={() =>
                                          handleRoleChange(u._id, r)
                                        }
                                        className="block w-full text-left px-3 py-2 text-xs font-medium hover:bg-secondary/60 transition-colors capitalize"
                                      >
                                        → {r}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {u.isBanned ? (
                              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                <Ban className="w-3 h-3" /> Banned
                              </span>
                            ) : u.isActive ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(u.createdAt).toLocaleDateString("en-IN")}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleBan(u)}
                                title={u.isBanned ? "Unban" : "Ban"}
                                className={`p-1.5 rounded-md transition-colors ${
                                  u.isBanned
                                    ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                    : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                }`}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(u._id, u.name)}
                                title="Delete"
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Note about role change API */}
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* Confirm delete/unban */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Ban reason modal */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setBanTarget(null)}
          />
          <div className="relative bg-background border border-foreground/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-wider mb-1">
              Ban User
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Ban <strong>{banTarget.name}</strong>? Provide a reason:
            </p>
            <input
              autoFocus
              placeholder="e.g. Spam activity, fraud, etc."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full border border-foreground/15 rounded-md px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground/40 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setBanTarget(null)}
                className="flex-1 border border-foreground/20 rounded-md py-2.5 text-sm font-medium hover:bg-secondary/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitBan}
                className="flex-1 bg-red-600 text-white rounded-md py-2.5 text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdowns on outside click */}
      {roleDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setRoleDropdown(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
