import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Check,
  CreditCard,
  Truck,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { orderApi, addressApi } from "@/lib/api";
import { paymentApi } from "@/lib/api";

const STEPS = [
  { label: "Information", icon: Package },
  { label: "Shipping", icon: Truck },
  { label: "Payment", icon: CreditCard },
];

const INPUT =
  "w-full border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent focus:outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tracks saved address _id — used for PUT (update) and checkout (addressId)
  const [savedAddressId, setSavedAddressId] = useState(null);
  const [addrSaving, setAddrSaving] = useState(false);

  const shipping = 99;
  const total = subtotal + shipping;

  const [info, setInfo] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // ── Prefill from user on mount ────────────────────────────────────────────
  // If user has a saved address → prefill all fields + store its _id for PUT
  // If user.addresses is empty  → form stays blank, user fills manually
  useEffect(() => {
    if (!user) return;

    const addr = user.addresses?.[0];

    setInfo({
      email: user.email || "",
      phone: addr?.phone || user.phone || "",
      firstName: user.name?.split(" ")[0] || "",
      lastName: user.name?.split(" ").slice(1).join(" ") || "",
      address: addr?.line1 || "",
      address2: addr?.line2 || "",
      city: addr?.city || "",
      state: addr?.state || "",
      pincode: addr?.pincode || "",
      country: addr?.country || "India",
    });

    if (addr?._id) setSavedAddressId(addr._id);
  }, [user]);

  const [shipping_method, setShippingMethod] = useState("standard");

  const [payment, setPayment] = useState({
    method: "card",
    card: "",
    expiry: "",
    cvv: "",
    name: "",
    upi: "",
  });

  const set = (obj, setObj) => (field) => (e) =>
    setObj((p) => ({ ...p, [field]: e.target.value }));

  const setI = set(info, setInfo);
  const setP = set(payment, setPayment);

  // ── Validate step 0 ───────────────────────────────────────────────────────
  const canProceed = () =>
    info.email &&
    info.firstName &&
    info.lastName &&
    info.address &&
    info.city &&
    info.state &&
    info.pincode;

  // ── Continue to Shipping ──────────────────────────────────────────────────
  // Has savedAddressId → PUT (user edited existing address)
  // No savedAddressId  → POST (first time, user filled form manually)
  const handleContinueToShipping = async () => {
    if (!canProceed()) return;
    setAddrSaving(true);

    const body = {
      fullName: `${info.firstName} ${info.lastName}`.trim(),
      phone: info.phone,
      line1: info.address,
      line2: info.address2,
      city: info.city,
      state: info.state,
      pincode: info.pincode,
      country: info.country,
    };

    try {
      if (savedAddressId) {
        // Update existing address
        await addressApi.update(savedAddressId, body);
      } else {
        // Save new address and store returned _id
        const data = await addressApi.add(body);
        const saved = data.address || data.data;
        setSavedAddressId(saved._id);
      }
      setStep(1);
    } catch (err) {
      alert(err.message || "Failed to save address. Please try again.");
    } finally {
      setAddrSaving(false);
    }
  };

  // Helper: loads Razorpay checkout script once
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (document.getElementById("razorpay-script")) return resolve(true);
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // ── COD: existing flow ──────────────────────────────────────────────────
      if (payment.method === "cod") {
        await orderApi.checkout({
          addressId: savedAddressId,
          shippingMethod: shipping_method,
        });
        await clearCart();
        setPlaced(true);
        return;
      }

      // ── Card / UPI: Razorpay flow ───────────────────────────────────────────
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Check your connection.");
        return;
      }

      // Step 1: Create Razorpay order on backend (amount computed server-side)
      const data = await paymentApi.createOrder({
        addressId: savedAddressId,
        shippingMethod: shipping_method,
      });

      // Step 2: Open Razorpay modal
      await new Promise((resolve, reject) => {
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          order_id: data.razorpayOrderId,
          name: "Your Store",
          description: "Order Payment",
          prefill: {
            name: `${info.firstName} ${info.lastName}`,
            email: info.email,
            contact: info.phone,
          },
          theme: { color: "#000000" },
          method:
            payment.method === "upi"
              ? { upi: true, card: false, netbanking: false, wallet: false }
              : payment.method === "card"
                ? { card: true, upi: false, netbanking: false, wallet: false }
                : undefined,
          handler: async (response) => {
            try {
              // Step 3: Verify signature + place order on backend
              await paymentApi.verify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                addressId: savedAddressId,
                shippingMethod: shipping_method,
              });
              await clearCart();
              setPlaced(true);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (err) {
      if (err.message !== "Payment cancelled") {
        alert(err.message || "Payment failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  // ── Order Placed screen ────────────────────────────────────────────────────
  if (placed)
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1
          className="text-4xl font-black uppercase mb-2"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Order Placed!
        </h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Thank you for your order. We'll send a confirmation to {info.email}.
        </p>
        <Link
          to="/products"
          className="bg-foreground text-background px-8 py-3.5 rounded-md font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Continue Shopping
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-foreground/10">
        <button
          onClick={() => (step > 0 ? setStep((s) => s - 1) : navigate(-1))}
          className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          {step > 0 ? "Back" : "Cart"}
        </button>
        <Link to="/">
          <div className="w-9 h-9 rounded-full border-2 border-foreground flex items-center justify-center">
            <Play className="w-3.5 h-3.5 fill-foreground" />
          </div>
        </Link>
        <div className="w-16" />
      </div>

      <div className="px-4 md:px-8 py-8 md:py-10 max-w-6xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-black uppercase mb-8"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Checkout
        </h1>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 ${i <= step ? "text-foreground" : "text-foreground/30"} ${i < step ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    i < step
                      ? "bg-foreground text-background border-foreground"
                      : i === step
                        ? "border-foreground text-foreground"
                        : "border-foreground/20 text-foreground/30"
                  }`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className="text-sm font-bold uppercase tracking-wider hidden sm:block">
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 md:w-16 h-px mx-2 md:mx-4 ${i < step ? "bg-foreground" : "bg-foreground/20"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* ── FORM ──────────────────────────────────────────────────────── */}
          <div className="flex-1 max-w-lg">
            {/* ── Step 0: Information ───────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider mb-4">
                    Contact
                  </h2>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Email *"
                      value={info.email}
                      onChange={setI("email")}
                      className={INPUT}
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={info.phone}
                      onChange={setI("phone")}
                      className={INPUT}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider mb-4">
                    Shipping Address
                  </h2>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        placeholder="First Name *"
                        value={info.firstName}
                        onChange={setI("firstName")}
                        className={INPUT}
                      />
                      <input
                        placeholder="Last Name *"
                        value={info.lastName}
                        onChange={setI("lastName")}
                        className={INPUT}
                      />
                    </div>
                    <input
                      placeholder="Address Line 1 *"
                      value={info.address}
                      onChange={setI("address")}
                      className={INPUT}
                    />
                    <input
                      placeholder="Address Line 2"
                      value={info.address2}
                      onChange={setI("address2")}
                      className={INPUT}
                    />
                    <div className="flex gap-3">
                      <input
                        placeholder="City *"
                        value={info.city}
                        onChange={setI("city")}
                        className={INPUT}
                      />
                      <input
                        placeholder="State *"
                        value={info.state}
                        onChange={setI("state")}
                        className={INPUT}
                      />
                    </div>
                    <div className="flex gap-3">
                      <input
                        placeholder="Pincode *"
                        value={info.pincode}
                        onChange={setI("pincode")}
                        className={INPUT}
                      />
                      <div className="relative flex-1">
                        <select
                          value={info.country}
                          onChange={setI("country")}
                          className={INPUT + " appearance-none cursor-pointer"}
                        >
                          <option value="India">India</option>
                          <option value="US">United States</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContinueToShipping}
                  disabled={!canProceed() || addrSaving}
                  className={`w-full font-bold uppercase tracking-wider py-4 rounded-md transition-all flex items-center justify-center gap-2 ${
                    canProceed() && !addrSaving
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-secondary/40 text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {addrSaving ? (
                    "Saving…"
                  ) : (
                    <>
                      {" "}
                      Continue to Shipping <Truck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Step 1: Shipping ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider mb-4">
                  Shipping Method
                </h2>

                {[
                  {
                    id: "standard",
                    label: "Standard Delivery",
                    eta: "5–7 business days",
                    price: 99,
                  },
                  {
                    id: "express",
                    label: "Express Delivery",
                    eta: "2–3 business days",
                    price: 199,
                  },
                  {
                    id: "next_day",
                    label: "Next Day Delivery",
                    eta: "1 business day",
                    price: 299,
                  },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                      shipping_method === m.id
                        ? "border-foreground bg-secondary/20"
                        : "border-foreground/10 hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={m.id}
                        checked={shipping_method === m.id}
                        onChange={() => setShippingMethod(m.id)}
                        className="accent-foreground"
                      />
                      <div>
                        <p className="text-sm font-bold">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.eta}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold">₹{m.price}</span>
                  </label>
                ))}

                {/* Delivery address recap */}
                <div className="border border-foreground/10 rounded-xl p-4 mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Delivering to
                  </p>
                  <p className="text-sm font-medium">
                    {info.firstName} {info.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {info.address}, {info.city}, {info.state} {info.pincode}
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-foreground text-background font-bold uppercase tracking-wider py-4 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Continue to Payment <CreditCard className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Step 2: Payment ───────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-sm font-black uppercase tracking-wider mb-4">
                  Payment Method
                </h2>

                {/* Method tabs */}
                <div className="flex gap-2 p-1 bg-secondary/40 rounded-lg mb-6">
                  {[
                    { id: "card", label: "Card" },
                    { id: "upi", label: "Netbanking & Wallet" },
                    { id: "cod", label: "COD" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() =>
                        setPayment((p) => ({ ...p, method: m.id }))
                      }
                      className={`flex-1 py-2.5 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${
                        payment.method === m.id
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Card fields */}
                {payment.method === "card" && (
                  <div className="space-y-3">
                    {/* <input
                      placeholder="Cardholder Name"
                      value={payment.name}
                      onChange={setP("name")}
                      className={INPUT}
                    />
                    <input
                      placeholder="Card Number"
                      value={payment.card}
                      onChange={setP("card")}
                      maxLength={19}
                      className={INPUT}
                    />
                    <div className="flex gap-3">
                      <input
                        placeholder="MM / YY"
                        value={payment.expiry}
                        onChange={setP("expiry")}
                        className={INPUT}
                      />
                      <input
                        placeholder="CVV"
                        value={payment.cvv}
                        onChange={setP("cvv")}
                        maxLength={3}
                        className={INPUT}
                        type="password"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                      Secure SSL encrypted payment
                    </p> */}
                  </div>
                )}

                {/* UPI */}
                {payment.method === "upi" && (
                  <div>
                    {/* <input
                      placeholder="Enter UPI ID (e.g. name@upi)"
                      value={payment.upi}
                      onChange={setP("upi")}
                      className={INPUT}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      A payment request will be sent to your UPI app.
                    </p> */}
                  </div>
                )}

                {/* COD */}
                {payment.method === "cod" && (
                  <div className="border border-foreground/10 rounded-xl p-5 text-sm text-muted-foreground">
                    <p className="font-bold text-foreground mb-1">
                      Cash on Delivery
                    </p>
                    <p>
                      Pay in cash when your order arrives. Additional ₹30 COD
                      fee may apply.
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-foreground text-background font-bold uppercase tracking-wider py-4 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    "Placing Order…"
                  ) : (
                    <>
                      Place Order <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY ─────────────────────────────────────────────── */}
          <div className="lg:w-[360px] shrink-0">
            <div className="border border-foreground/10 rounded-2xl p-6 sticky top-6">
              <h2 className="text-sm font-black uppercase tracking-wider mb-5">
                Your Order
              </h2>

              <div className="space-y-4 mb-5">
                {items.map((item) => (
                  <div
                    key={item.id + (item.variantSku || "")}
                    className="flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary/30 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/56x56/f5f5f5/999?text=·";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      {item.variantSku && (
                        <p className="text-xs text-muted-foreground">
                          {item.variantSku}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-foreground/10 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₹{shipping}</span>
                </div>
              </div>

              <div className="border-t border-foreground/10 mt-4 pt-4 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase">Total</span>
                <span className="text-2xl font-black">
                  ₹{total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
