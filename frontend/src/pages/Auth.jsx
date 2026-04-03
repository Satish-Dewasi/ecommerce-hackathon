import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Play, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Auth = () => {
  const navigate        = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
  });

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
          name:     form.name,
          email:    form.email,
          password: form.password,
          phone:    form.phone,
        });
        setSuccess("Account created! Please log in.");
        setMode("login");
        setForm((p) => ({ ...p, name: "", phone: "", password: "" }));
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity">
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
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
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
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={set("phone")}
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
                Password * {mode === "register" && <span className="font-normal normal-case">(min 6 chars)</span>}
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
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background font-bold uppercase tracking-wider py-4 rounded-md transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
            >
              {loading
                ? "Please wait…"
                : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
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