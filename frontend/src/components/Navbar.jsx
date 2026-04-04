import { useState, useRef, useEffect } from "react";
import { Menu, ShoppingBag, User, LogOut, Play, LayoutDashboard, ShoppingCart, LogIn, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { totalItems }               = useCart();
  const { isLoggedIn, logout, user } = useAuth();
  const navigate                     = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef                  = useRef(null);

  const dashboardPath =
    user?.role === "admin"  ? "/admin"  :
    user?.role === "seller" ? "/seller" : null;

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="flex items-center justify-between px-6 md:px-8 py-5 relative">

      {/* ── Left ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 md:gap-8">
        <button className="p-2" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
          <Link to="/"         className="hover:opacity-70 transition-opacity">Home</Link>
          <Link to="/products" className="hover:opacity-70 transition-opacity">Collections</Link>
          <Link to="/products" className="hover:opacity-70 transition-opacity">New</Link>
        </div>
      </div>

      {/* ── Center logo ───────────────────────────────────────────────────── */}
      <Link to="/" className="absolute left-1/2 -translate-x-1/2">
        <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center hover:opacity-70 transition-opacity">
          <Play className="w-4 h-4 fill-foreground" />
        </div>
      </Link>

      {/* ── Right ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">

        {/* Cart with badge */}
        <Link
          to="/cart"
          className="relative flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Cart
          <ShoppingBag className="w-4 h-4" />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </Link>

        {/* User icon + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
            aria-label="Account"
          >
            <User className="w-5 h-5" />
          </button>

          {/* ── Dropdown panel ──────────────────────────────────────────── */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-background border border-foreground/10 rounded-xl shadow-xl overflow-hidden z-50">

              {isLoggedIn ? (
                <>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-foreground/10 bg-secondary/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold truncate mt-0.5">{user?.name}</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 capitalize
                      ${user?.role === "admin"  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        user?.role === "seller" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                  "bg-secondary text-muted-foreground"}`}>
                      {user?.role}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {/* Dashboard — only for admin / seller */}
                    {dashboardPath ? (
                      <Link
                        to={dashboardPath}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                    ) : (
                      /* Orders — only for customers */
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                        My Orders
                      </Link>
                    )}

                    {/* Divider */}
                    <div className="border-t border-foreground/10 my-1" />

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                /* ── Logged out state ──────────────────────────────────── */
                <div className="py-1">
                  <Link
                    to="/auth"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-secondary/60 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-muted-foreground" />
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-secondary/60 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;