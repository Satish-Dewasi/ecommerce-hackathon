import { Play } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background px-6 md:px-12 py-12 md:py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-bold text-sm mb-4">MENU</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Contacts</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-4">LANGUAGES</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>ENG</li>
            <li>HIN</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-4">TOP BRANDS</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>Taste Sub Collection</li>
          </ul>
        </div>
        <div className="flex flex-col items-start md:items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-background flex items-center justify-center">
              <Play className="w-5 h-5 fill-background" />
            </div>
            <span className="text-2xl font-black" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              XIV<br />QR
            </span>
          </div>
          <p className="text-xs opacity-50 mt-6">© 2026 TEAM 6</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
