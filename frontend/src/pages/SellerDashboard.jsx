import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  TrendingUp,
  ShoppingCart,
  LogOut,
  Play,
  Plus,
  Star,
  AlertCircle,
  X,
  RefreshCw,
  BarChart3,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Loader2,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sellerApi } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "products", label: "My Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "sales", label: "Sales", icon: TrendingUp },
];

// Valid status transitions a seller can make
const STATUS_OPTIONS = [
  {
    value: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-blue-500",
  },
  { value: "shipped", label: "Shipped", icon: Truck, color: "text-purple-500" },
  {
    value: "delivered",
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-500",
  },
  {
    value: "returned",
    label: "Returned",
    icon: RotateCcw,
    color: "text-amber-500",
  },
];

const STATUS_STYLES = {
  pending:
    "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  confirmed:
    "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  shipped:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered:
    "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
  cancelled:
    "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
  returned:
    "bg-gray-100   text-gray-600   dark:bg-gray-800      dark:text-gray-400",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─── Sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, trend }) => (
  <div className="border border-foreground/10 rounded-2xl p-5">
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
      {label}
    </p>
    <p className="text-3xl font-black">{value}</p>
    {sub && (
      <p
        className={`text-xs mt-1 flex items-center gap-1 ${
          trend === "up"
            ? "text-green-600 dark:text-green-400"
            : trend === "down"
              ? "text-red-500"
              : "text-muted-foreground"
        }`}
      >
        {trend === "up" && <ArrowUp className="w-3 h-3" />}
        {trend === "down" && <ArrowDown className="w-3 h-3" />}
        {sub}
      </p>
    )}
  </div>
);

const MiniBarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-foreground rounded-t-sm transition-all duration-500"
            style={{
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? "4px" : "0",
            }}
          />
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Status Dropdown ──────────────────────────────────────────────────────────
const StatusDropdown = ({ orderId, currentStatus, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (newStatus) => {
    if (newStatus === currentStatus) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(false);
    try {
      await sellerApi.updateOrderStatus(orderId, { status: newStatus });
      onUpdate(orderId, newStatus);
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-opacity ${
          STATUS_STYLES[currentStatus] || STATUS_STYLES.pending
        } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <span className="capitalize">{currentStatus}</span>
        )}
        {!loading && (
          <ChevronDown
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-background border border-foreground/10 rounded-xl shadow-lg overflow-hidden w-40">
            {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-secondary/60 transition-colors text-left
                  ${value === currentStatus ? "bg-secondary/40 font-bold" : ""}`}
              >
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                {label}
                {value === currentStatus && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    current
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Order Row ─────────────────────────────────────────────────────────────────
const OrderRow = ({ order, onStatusUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const so = order.sellerOrder; // seller's own slice
  if (!so) return null;

  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <tr
        className="border-b border-foreground/5 hover:bg-secondary/20 transition-colors cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            #{order._id.slice(-8).toUpperCase()}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium">
            {order.customer?.name || "Customer"}
          </div>
          <div className="text-xs text-muted-foreground">
            {order.customer?.email}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {so.items.length} item{so.items.length > 1 ? "s" : ""}
        </td>
        <td className="px-4 py-3 font-bold text-sm">
          ₹{so.subTotal.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{date}</td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <StatusDropdown
            orderId={order._id}
            currentStatus={so.status}
            onUpdate={onStatusUpdate}
          />
        </td>
        <td className="px-4 py-3">
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-secondary/10">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Items */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Items
                </p>
                <div className="flex flex-col gap-2">
                  {so.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm border border-foreground/10 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-xs">
                          {item.product?.name || item.variantSnapshot.sku}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.variantSnapshot.color} ·{" "}
                          {item.variantSnapshot.size} · SKU:{" "}
                          {item.variantSnapshot.sku}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xs font-bold">
                          ₹{item.itemTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ×{item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping + Payment */}
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Shipping Address
                  </p>
                  <div className="text-xs text-muted-foreground border border-foreground/10 rounded-lg px-3 py-2 leading-5">
                    <p className="font-medium text-foreground">
                      {order.shippingAddress?.fullName}
                    </p>
                    <p>{order.shippingAddress?.street}</p>
                    <p>
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.state} —{" "}
                      {order.shippingAddress?.pincode}
                    </p>
                    <p>{order.shippingAddress?.phone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Status History
                  </p>
                  <div className="flex flex-col gap-1">
                    {so.statusHistory
                      ?.slice()
                      .reverse()
                      .map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <span
                            className={`capitalize font-medium ${i === 0 ? "text-foreground" : ""}`}
                          >
                            {h.status}
                          </span>
                          {h.note && <span>· {h.note}</span>}
                          <span className="ml-auto">
                            {new Date(h.changedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Tracking info if shipped */}
                {so.trackingInfo?.trackingNumber && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Tracking
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {so.trackingInfo.courier} ·{" "}
                      {so.trackingInfo.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
      };
      const data = await sellerApi.getOrders(params);
      setOrders(data.orders || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Optimistically update status in local state — no refetch needed
  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o._id !== orderId) return o;
        return {
          ...o,
          sellerOrder: {
            ...o.sellerOrder,
            status: newStatus,
            statusHistory: [
              ...(o.sellerOrder?.statusHistory || []),
              { status: newStatus, changedAt: new Date().toISOString() },
            ],
          },
        };
      }),
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-3xl font-black uppercase"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Orders
          </h1>
          <p className="text-sm text-muted-foreground">{total} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 hover:bg-secondary/60 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-foreground/20 rounded-2xl">
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">No orders yet.</p>
        </div>
      ) : (
        <>
          <div className="border border-foreground/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/10 bg-secondary/20">
                  {[
                    "Order ID",
                    "Customer",
                    "Items",
                    "Amount",
                    "Date",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-foreground/10 rounded-lg text-xs disabled:opacity-40 hover:bg-secondary/60 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-foreground/10 rounded-lg text-xs disabled:opacity-40 hover:bg-secondary/60 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const generateMockSales = () =>
  MONTHS.map((label, i) => ({
    label,
    value:
      i <= new Date().getMonth() ? Math.floor(Math.random() * 40000) + 5000 : 0,
    orders: i <= new Date().getMonth() ? Math.floor(Math.random() * 30) + 5 : 0,
  }));

const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [salesData] = useState(generateMockSales);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await sellerApi.getMyProducts({ limit: 50 });
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "products") fetchProducts();
  }, [activeTab, fetchProducts]);

  const currentMonth = new Date().getMonth();
  const thisMonthSales = salesData[currentMonth]?.value || 0;
  const lastMonthSales = salesData[currentMonth - 1]?.value || 0;
  const totalSales = salesData.reduce((s, d) => s + d.value, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);
  const salesTrend = thisMonthSales >= lastMonthSales ? "up" : "down";
  const salesDiff =
    lastMonthSales > 0
      ? Math.abs(
          ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100,
        ).toFixed(0)
      : 0;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[240px] border-r border-foreground/10 p-6 shrink-0">
        <Link to="/" className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full border-2 border-foreground flex items-center justify-center">
            <Play className="w-3 h-3 fill-foreground" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest">
            Seller
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
              <p className="text-xs text-muted-foreground">Seller</p>
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
            Seller Panel
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

        <div className="p-6 md:p-8 max-w-5xl">
          {/* Error banner */}
          {error && activeTab === "products" && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError("")} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── PRODUCTS TAB ─────────────────────────────────────────────── */}
          {activeTab === "products" && (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1
                    className="text-3xl font-black uppercase"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    My Products
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {products.length} listed
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchProducts}
                    className="p-2 hover:bg-secondary/60 rounded-lg transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </button>
                  <Link
                    to="/products"
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <StatCard
                  label="Total Products"
                  value={products.length}
                  sub="Listed"
                />
                <StatCard
                  label="In Stock"
                  value={
                    products.filter((p) => p.variants?.some((v) => v.stock > 0))
                      .length
                  }
                  sub="With available stock"
                  trend="up"
                />
                <StatCard
                  label="Avg Rating"
                  value={
                    products.length
                      ? (
                          products.reduce(
                            (s, p) => s + (p.averageRating || 0),
                            0,
                          ) / products.length
                        ).toFixed(1)
                      : "—"
                  }
                  sub="Across all products"
                />
                <StatCard
                  label="Categories"
                  value={
                    [
                      ...new Set(
                        products.map((p) => p.category).filter(Boolean),
                      ),
                    ].length
                  }
                  sub="men / women / kids"
                />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-foreground/10 rounded-2xl p-4 animate-pulse"
                    >
                      <div className="bg-secondary/40 rounded-xl h-40 mb-3" />
                      <div className="h-4 bg-secondary/40 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-secondary/40 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-foreground/20 rounded-2xl">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">
                    No products yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Link
                      to={`/product/${p._id}`}
                      key={p._id}
                      className="group border border-foreground/10 rounded-2xl overflow-hidden hover:border-foreground/30 transition-colors"
                    >
                      <div className="bg-secondary/20 h-40 overflow-hidden">
                        {p.images?.[0]?.url ? (
                          <img
                            src={p.images[0].url}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/300x200/f5f5f5/999?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-bold truncate">{p.name}</p>
                          <p className="text-sm font-black shrink-0">
                            ₹{p.salePrice ?? p.basePrice}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize mb-2">
                          {p.brand || p.category}
                        </p>
                        <div className="flex items-center justify-between">
                          {p.averageRating > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="w-3 h-3 fill-foreground text-foreground" />
                              {p.averageRating.toFixed(1)} ({p.totalReviews})
                            </span>
                          )}
                          <span
                            className={`text-xs font-medium ml-auto ${
                              p.variants?.some((v) => v.stock > 0)
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-500"
                            }`}
                          >
                            {p.variants?.some((v) => v.stock > 0)
                              ? "In Stock"
                              : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS TAB ───────────────────────────────────────────────── */}
          {activeTab === "orders" && <OrdersTab />}

          {/* ── SALES TAB ────────────────────────────────────────────────── */}
          {activeTab === "sales" && (
            <div>
              <h1
                className="text-3xl font-black uppercase mb-2"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Monthly Sales
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                {new Date().getFullYear()} overview — simulated data until
                orders API is available.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <StatCard
                  label="This Month"
                  value={`₹${(thisMonthSales / 1000).toFixed(1)}k`}
                  sub={`${salesTrend === "up" ? "+" : "-"}${salesDiff}% vs last month`}
                  trend={salesTrend}
                />
                <StatCard
                  label="Total Revenue"
                  value={`₹${(totalSales / 1000).toFixed(0)}k`}
                  sub="Year to date"
                />
                <StatCard
                  label="Total Orders"
                  value={totalOrders}
                  sub="All months"
                />
                <StatCard
                  label="Avg Order Value"
                  value={
                    totalOrders > 0
                      ? `₹${Math.round(totalSales / totalOrders)}`
                      : "—"
                  }
                  sub="Per order"
                />
              </div>

              <div className="border border-foreground/10 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Revenue by Month
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {new Date().getFullYear()}
                  </span>
                </div>
                <MiniBarChart data={salesData} />
              </div>

              <div className="border border-foreground/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-foreground/10 bg-secondary/20">
                      {["Month", "Orders", "Revenue", "Avg/Order"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? "text-left" : "text-right"}`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {salesData
                      .filter((d) => d.value > 0)
                      .map((d, i) => (
                        <tr
                          key={i}
                          className="border-b border-foreground/5 hover:bg-secondary/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{d.label}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {d.orders}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            ₹{d.value.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            ₹
                            {d.orders > 0
                              ? Math.round(d.value / d.orders).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
