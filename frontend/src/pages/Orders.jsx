import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { orderApi } from "@/lib/api";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS[status?.toLowerCase()] || STATUS.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// ─── Order card ───────────────────────────────────────────────────────────────
const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  const allItems = order.sellerOrders?.flatMap((so) => so.items) || [];
  const itemCount = allItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0,
  );
  const city = order.shippingAddress?.city || "";

  return (
    <div className="border border-foreground/10 rounded-2xl overflow-hidden hover:border-foreground/25 transition-colors">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 bg-secondary/20 border-b border-foreground/10 flex-wrap gap-3">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Order ID
            </p>
            <p className="text-sm font-bold font-mono mt-0.5">
              #{order._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Placed On
            </p>
            <p className="text-sm mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total
            </p>
            <p className="text-sm font-bold mt-0.5">
              ₹{order.grandTotal?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Payment
            </p>
            <p className="text-sm mt-0.5 capitalize">
              {order.payment?.method?.toUpperCase()} · {order.payment?.status}
            </p>
          </div>
        </div>
        <StatusBadge status={order.overallStatus} />
      </div>

      {/* Items */}
      {order.sellerOrders?.map((sellerOrder) =>
        sellerOrder.items.map((item, i) => {
          const v = item.variantSnapshot || {};
          return (
            <div
              key={`${sellerOrder._id}-${i}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-foreground/5 last:border-0"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary/30 shrink-0">
                {item.product?.image ? (
                  <img
                    src={item.product.image}
                    alt={item.product?.name || "Product"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/64x64/f5f5f5/999?text=·";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground opacity-40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {item.product?.name || "Product"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[v.color, v.size].filter(Boolean).join(" · ")}
                  {v.sku && <span className="ml-1">· SKU: {v.sku}</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-black shrink-0">
                ₹{(item.itemTotal ?? v.price * item.quantity)?.toLocaleString()}
              </p>
            </div>
          );
        }),
      )}

      {/* Card footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-foreground/10 bg-secondary/10">
        <p className="text-xs text-muted-foreground">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
          {city && ` · Delivering to ${city}`}
        </p>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1 text-xs font-bold hover:opacity-70 transition-opacity"
        >
          {expanded ? "Hide Details" : "View Details"}
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          />
        </button>
      </div>

      {/* ── Expanded detail panel ─────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-foreground/10 bg-background divide-y divide-foreground/5">
          {/* Shipping address */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Shipping Address
            </p>
            <p className="text-sm font-bold">
              {order.shippingAddress?.fullName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.shippingAddress?.phone}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.shippingAddress?.street}, {order.shippingAddress?.city},{" "}
              {order.shippingAddress?.state} – {order.shippingAddress?.pincode}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.shippingAddress?.country}
            </p>
          </div>

          {/* Shipping method + cost */}
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Shipping Method
              </p>
              <p className="text-sm capitalize">
                {order.shippingMethod?.replace("_", " ") || "Standard"}
              </p>
            </div>
            <p className="text-sm font-bold">₹{order.shippingCost ?? 99}</p>
          </div>

          {/* Per-seller fulfillment status */}
          {order.sellerOrders?.length > 1 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Seller Fulfilment
              </p>
              <div className="space-y-2">
                {order.sellerOrders.map((so) => (
                  <div
                    key={so._id}
                    className="flex items-center justify-between"
                  >
                    <p className="text-xs text-muted-foreground">
                      {so.items.length} item{so.items.length !== 1 ? "s" : ""} ·{" "}
                      ₹{so.subTotal?.toLocaleString()}
                    </p>
                    <StatusBadge status={so.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking info (shown only if any seller has it) */}
          {order.sellerOrders?.some(
            (so) => so.trackingInfo?.trackingNumber,
          ) && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Tracking
              </p>
              {order.sellerOrders
                .filter((so) => so.trackingInfo?.trackingNumber)
                .map((so) => (
                  <div
                    key={so._id}
                    className="text-xs text-muted-foreground space-y-0.5"
                  >
                    <p>
                      <span className="font-bold text-foreground">
                        {so.trackingInfo.courier}
                      </span>
                    </p>
                    <p>Tracking #: {so.trackingInfo.trackingNumber}</p>
                    {so.trackingInfo.estimatedDelivery && (
                      <p>
                        Est. Delivery:{" "}
                        {new Date(
                          so.trackingInfo.estimatedDelivery,
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Payment breakdown */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Price Breakdown
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items subtotal</span>
                <span>
                  ₹
                  {(
                    (order.grandTotal ?? 0) - (order.shippingCost ?? 99)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>₹{order.shippingCost ?? 99}</span>
              </div>
              <div className="flex justify-between font-black border-t border-foreground/10 pt-2 mt-2">
                <span>Grand Total</span>
                <span>₹{order.grandTotal?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Payment Info
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Method:{" "}
                <span className="text-foreground font-bold uppercase">
                  {order.payment?.method}
                </span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={`font-bold ${order.payment?.status === "paid" ? "text-green-500" : "text-amber-500"}`}
                >
                  {order.payment?.status}
                </span>
              </p>
              {order.payment?.gatewayPaymentId && (
                <p>
                  Payment ID:{" "}
                  <span className="font-mono text-foreground">
                    {order.payment.gatewayPaymentId}
                  </span>
                </p>
              )}
              {order.payment?.paidAt && (
                <p>
                  Paid At:{" "}
                  {new Date(order.payment.paidAt).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ─── Main page ────────────────────────────────────────────────────────────────
const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  // ── Fetch orders ───────────────────────────────────────────────────────────
  useEffect(() => {
    orderApi
      .getAll()
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(err.message || "Failed to load orders."))
      .finally(() => setLoading(false));
  }, []);

  // ── Filter tabs ────────────────────────────────────────────────────────────
  const TABS = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const displayed =
    filter === "all"
      ? orders
      : orders.filter((o) => o.overallStatus?.toLowerCase() === filter);

  // ── Skeleton ───────────────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="border border-foreground/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="px-5 py-4 bg-secondary/20 border-b border-foreground/10 flex gap-8">
        <div className="h-8 w-32 bg-secondary/40 rounded" />
        <div className="h-8 w-24 bg-secondary/40 rounded" />
        <div className="h-8 w-20 bg-secondary/40 rounded ml-auto" />
      </div>
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-secondary/40 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary/40 rounded w-2/3" />
          <div className="h-3 bg-secondary/40 rounded w-1/3" />
        </div>
        <div className="h-5 w-16 bg-secondary/40 rounded" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            {" / "}
            <span className="text-foreground">My Orders</span>
          </p>
          <h1
            className="text-4xl font-black uppercase"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            My Orders
          </h1>
          {!loading && !error && (
            <p className="text-sm text-muted-foreground mt-1">
              {orders.length} order{orders.length !== 1 ? "s" : ""} total
            </p>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TABS.map((tab) => {
            const count =
              tab.id === "all"
                ? orders.length
                : orders.filter(
                    (o) => o.overallStatus?.toLowerCase() === tab.id,
                  ).length;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors shrink-0 ${
                  filter === tab.id
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground/20 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      filter === tab.id ? "bg-background/20" : "bg-secondary"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : error ? (
          <div className="text-center py-24 border border-dashed border-red-300 rounded-2xl">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-red-500 mb-1">
              Failed to load orders
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-foreground/20 rounded-2xl">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            {orders.length === 0 ? (
              <>
                <p className="text-sm font-bold mb-1">No orders yet</p>
                <p className="text-xs text-muted-foreground mb-6">
                  Looks like you haven't placed any orders yet.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Start Shopping
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-bold mb-1">No {filter} orders</p>
                <button
                  onClick={() => setFilter("all")}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors mt-1"
                >
                  View all orders
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
