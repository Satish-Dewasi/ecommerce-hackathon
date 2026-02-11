import { Menu, ShoppingBag, User, Clock, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 md:px-8 py-5">
      <div className="flex items-center gap-6 md:gap-8">
        <button className="p-2" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
          <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
          <Link to="/products" className="hover:opacity-70 transition-opacity">Collections</Link>
          <Link to="/products" className="hover:opacity-70 transition-opacity">New</Link>
        </div>
      </div>

      <Link to="/" className="absolute left-1/2 -translate-x-1/2">
        <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center">
          <Play className="w-4 h-4 fill-foreground" />
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <button className="p-2 hidden sm:block" aria-label="Notifications">
          <Clock className="w-5 h-5" />
        </button>
        <Link to="/cart" className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          Cart
          <ShoppingBag className="w-4 h-4" />
        </Link>
        <button className="p-2" aria-label="Profile">
          <User className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
