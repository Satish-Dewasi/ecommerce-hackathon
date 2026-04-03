import { Menu, ShoppingBag, User, LogOut, Play, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { totalItems }               = useCart();
  const { isLoggedIn, logout, user } = useAuth();
  const navigate                     = useNavigate();

  const dashboardPath =
    user?.role === "admin"  ? "/admin"  :
    user?.role === "seller" ? "/seller" : null;

  const handleUserClick = () => {
    if (isLoggedIn) return;
    navigate("/auth");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-8 py-5 relative">
      {/* Left */}
      <div className="flex items-center gap-6 md:gap-8">
        <button className="p-2" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
          <Link to="/"         className="hover:opacity-70 transition-opacity">Home</Link>
          <Link to="/products" className="hover:opacity-70 transition-opacity">Collections</Link>
          <Link to="/products" className="hover:opacity-70 transition-opacity">New</Link>
          {/* Show dashboard link for admin/seller */}
          {dashboardPath && (
            <Link to={dashboardPath} className="hover:opacity-70 transition-opacity flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Center logo */}
      <Link to="/" className="absolute left-1/2 -translate-x-1/2">
        <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center hover:opacity-70 transition-opacity">
          <Play className="w-4 h-4 fill-foreground" />
        </div>
      </Link>

      {/* Right */}
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

        {/* User / Login */}
        {isLoggedIn ? (
          <div className="flex items-center gap-1">
            {/* Dashboard icon on mobile */}
            {dashboardPath && (
              <Link to={dashboardPath} className="p-2 rounded-full hover:bg-secondary/60 transition-colors md:hidden" title="Dashboard">
                <LayoutDashboard className="w-4 h-4" />
              </Link>
            )}
            <button
              className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
              aria-label="Profile"
              title={user?.name || "Profile"}
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleUserClick}
            className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
            aria-label="Sign in"
            title="Sign in"
          >
            <User className="w-5 h-5" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;