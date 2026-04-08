import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Play, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Open register tab directly when /auth?mode=register
  useEffect(() => {
    if (searchParams.get("mode") === "register") setMode("register");
  }, [searchParams]);
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSeller, setIsSeller] = useState(false);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
        navigate("/");
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: isSeller ? "seller" : "customer",
        });
        setSuccess(
          `${isSeller ? "Seller account" : "Account"} created! Please log in.`,
        );
        setMode("login");
        setIsSeller(false);
        setForm((p) => ({ ...p, name: "", password: "" }));
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 md:px-10 py-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border-2 border-foreground flex items-center justify-center">
            <Play className="w-3.5 h-3.5 fill-foreground" />
          </div>
        </Link>
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md border border-foreground/10 rounded-2xl p-8 md:p-10">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-secondary/40 rounded-lg mb-8">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2.5 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${
                  mode === m
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <h1
            className="text-3xl font-black uppercase mb-2"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "login"
              ? "Sign in to access your cart, orders, and wishlist."
              : isSeller
                ? "Create a seller account to list and manage your products."
                : "Join us to start shopping."}
          </p>

          {/* Feedback */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm rounded-lg px-4 py-3 mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register-only fields */}
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={set("name")}
                    required
                    className="w-full border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Email *
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                required
                className="w-full border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent focus:outline-none focus:border-foreground/40 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Password *{" "}
                {mode === "register" && (
                  <span className="font-normal normal-case">(min 6 chars)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={mode === "register" ? 6 : undefined}
                  className="w-full border border-foreground/15 rounded-md px-4 py-3.5 pr-12 text-sm bg-transparent focus:outline-none focus:border-foreground/40 transition-colors"
                />

                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Seller checkbox */}
            {mode === "register" && (
              <label
                className={`flex items-start gap-3 mt-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  isSeller
                    ? "border-foreground bg-secondary/40"
                    : "border-foreground/15 hover:border-foreground/30"
                }`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isSeller}
                    onChange={(e) => setIsSeller(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                      isSeller
                        ? "bg-foreground border-foreground"
                        : "border-foreground/30"
                    }`}
                  >
                    {isSeller && (
                      <svg
                        className="w-3 h-3 text-background"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold">Register as a Seller</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    List products, manage inventory, and track your sales from
                    the seller dashboard.
                  </p>
                </div>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background font-bold uppercase tracking-wider py-4 rounded-md transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setSuccess("");
              }}
              className="font-bold text-foreground hover:underline"
            >
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
