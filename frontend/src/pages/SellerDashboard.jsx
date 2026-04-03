import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package, TrendingUp, ShoppingCart, LogOut,
  Play, Plus, Star, AlertCircle, X,
  RefreshCw, BarChart3, ArrowUp, ArrowDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { productApi } from "@/lib/api";

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV = [
  { id: "products", label: "My Products", icon: Package   },
  { id: "orders",   label: "Orders",      icon: ShoppingCart },
  { id: "sales",    label: "Sales",       icon: TrendingUp   },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, trend }) => (
  <div className="border border-foreground/10 rounded-2xl p-5">
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
    <p className="text-3xl font-black">{value}</p>
    {sub && (
      <p className={`text-xs mt-1 flex items-center gap-1 ${trend === "up" ? "text-green-600 dark:text-green-400" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
        {trend === "up" && <ArrowUp className="w-3 h-3" />}
        {trend === "down" && <ArrowDown className="w-3 h-3" />}
        {sub}
      </p>
    )}
  </div>
);

// ─── Mini bar chart (pure CSS/SVG, no library needed) ────────────────────────
const MiniBarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-foreground rounded-t-sm transition-all duration-500"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? "4px" : "0" }}
          />
          <span className="text-[10px] text-muted-foreground rotate-0 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Monthly mock data (replace with real orders API when available) ──────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const generateMockSales = () =>
  MONTHS.map((label, i) => ({
    label,
    value: i <= new Date().getMonth() ? Math.floor(Math.random() * 40000) + 5000 : 0,
    orders: i <= new Date().getMonth() ? Math.floor(Math.random() * 30) + 5 : 0,
  }));

// ─── Main component ───────────────────────────────────────────────────────────
const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [salesData]               = useState(generateMockSales);

  // ── Fetch this seller's products ─────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Filter by seller — the API supports all products; we filter client-side
      // since backend doesn't have a /my-products endpoint yet
      const data = await productApi.getAll({ sort: "newest" });
      const mine = (data.data || []).filter(
        (p) => p.seller === user?._id || p.seller?._id === user?._id
      );
      // If no seller-filtered products (seller field may not be set in test data),
      // show all products for demo purposes
      setProducts(mine.length > 0 ? mine : (data.data || []));
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "products") fetchProducts();
  }, [activeTab, fetchProducts]);

  // ── Derived sales stats ───────────────────────────────────────────────────
  const currentMonth   = new Date().getMonth();
  const thisMonthSales = salesData[currentMonth]?.value || 0;
  const lastMonthSales = salesData[currentMonth - 1]?.value || 0;
  const totalSales     = salesData.reduce((s, d) => s + d.value, 0);
  const totalOrders    = salesData.reduce((s, d) => s + d.orders, 0);
  const salesTrend     = thisMonthSales >= lastMonthSales ? "up" : "down";
  const salesDiff      = lastMonthSales > 0
    ? Math.abs(((thisMonthSales - lastMonthSales) / lastMonthSales) * 100).toFixed(0)
    : 0;

  const handleLogout = async () => { await logout(); navigate("/"); };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[240px] border-r border-foreground/10 p-6 shrink-0">
        <Link to="/" className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full border-2 border-foreground flex items-center justify-center">
            <Play className="w-3 h-3 fill-foreground" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest">Seller</span>
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
          <span className="text-sm font-black uppercase tracking-widest">Seller Panel</span>
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
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* ── PRODUCTS TAB ─────────────────────────────────────────────── */}
          {activeTab === "products" && (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-black uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    My Products
                  </h1>
                  <p className="text-sm text-muted-foreground">{products.length} listed</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchProducts} className="p-2 hover:bg-secondary/60 rounded-lg transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <Link
                    to="/products"
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </Link>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <StatCard label="Total Products" value={products.length} sub="Listed" />
                <StatCard
                  label="In Stock"
                  value={products.filter((p) => p.variants?.some((v) => v.stock > 0)).length}
                  sub="With available stock"
                  trend="up"
                />
                <StatCard
                  label="Avg Rating"
                  value={
                    products.length
                      ? (products.reduce((s, p) => s + (p.averageRating || 0), 0) / products.length).toFixed(1)
                      : "—"
                  }
                  sub="Across all products"
                />
                <StatCard
                  label="Categories"
                  value={[...new Set(products.map((p) => p.category).filter(Boolean))].length}
                  sub="men / women / kids"
                />
              </div>

              {/* Product grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border border-foreground/10 rounded-2xl p-4 animate-pulse">
                      <div className="bg-secondary/40 rounded-xl h-40 mb-3" />
                      <div className="h-4 bg-secondary/40 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-secondary/40 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-foreground/20 rounded-2xl">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">No products yet.</p>
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
                            onError={(e) => { e.target.src = "https://placehold.co/300x200/f5f5f5/999?text=No+Image"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-bold truncate">{p.name}</p>
                          <p className="text-sm font-black shrink-0">₹{p.salePrice ?? p.basePrice}</p>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize mb-2">{p.brand || p.category}</p>
                        <div className="flex items-center justify-between">
                          {p.averageRating > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="w-3 h-3 fill-foreground text-foreground" />
                              {p.averageRating.toFixed(1)} ({p.totalReviews})
                            </span>
                          )}
                          <span className={`text-xs font-medium ml-auto ${
                            p.variants?.some((v) => v.stock > 0)
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-500"
                          }`}>
                            {p.variants?.some((v) => v.stock > 0) ? "In Stock" : "Out of Stock"}
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
          {activeTab === "orders" && (
            <div>
              <h1 className="text-3xl font-black uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Orders
              </h1>
              <p className="text-sm text-muted-foreground mb-8">Order management from your customers.</p>

              {/* Placeholder — orders API not implemented on backend yet */}
              <div className="border border-dashed border-foreground/20 rounded-2xl p-12 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-sm font-bold mb-1">Orders API coming soon</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Ask your backend teammate to add an Orders model and{" "}
                  <code className="bg-secondary/60 px-1 rounded">GET /api/v1/seller/orders</code> endpoint.
                  This tab will populate automatically once it's ready.
                </p>
              </div>

              {/* Mock order table for UI preview */}
              <div className="mt-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Preview (mock data)</h2>
                <div className="border border-foreground/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-foreground/10 bg-secondary/20">
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Order ID</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "#ORD-001", product: "Men Regular Fit T-Shirt", customer: "Rahul S.", amount: 799,  status: "Delivered" },
                        { id: "#ORD-002", product: "Women Oversized Hoodie",  customer: "Priya M.", amount: 1499, status: "Shipped"   },
                        { id: "#ORD-003", product: "Kids Printed T-Shirt",    customer: "Ankit R.", amount: 499,  status: "Pending"   },
                      ].map((o) => (
                        <tr key={o.id} className="border-b border-foreground/5 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.id}</td>
                          <td className="px-4 py-3 font-medium">{o.product}</td>
                          <td className="px-4 py-3 text-muted-foreground">{o.customer}</td>
                          <td className="px-4 py-3 font-bold">₹{o.amount}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              o.status === "Delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              o.status === "Shipped"   ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                         "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SALES TAB ────────────────────────────────────────────────── */}
          {activeTab === "sales" && (
            <div>
              <h1 className="text-3xl font-black uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Monthly Sales
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                {new Date().getFullYear()} overview — simulated data until orders API is available.
              </p>

              {/* KPI row */}
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
                  value={totalOrders > 0 ? `₹${Math.round(totalSales / totalOrders)}` : "—"}
                  sub="Per order"
                />
              </div>

              {/* Bar chart */}
              <div className="border border-foreground/10 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Revenue by Month
                  </h2>
                  <span className="text-xs text-muted-foreground">{new Date().getFullYear()}</span>
                </div>
                <MiniBarChart data={salesData} />
              </div>

              {/* Monthly breakdown table */}
              <div className="border border-foreground/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-foreground/10 bg-secondary/20">
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Month</th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Orders</th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue</th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg/Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.filter((d) => d.value > 0).map((d, i) => (
                      <tr key={i} className="border-b border-foreground/5 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{d.label}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{d.orders}</td>
                        <td className="px-4 py-3 text-right font-bold">₹{d.value.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          ₹{d.orders > 0 ? Math.round(d.value / d.orders).toLocaleString() : "—"}
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