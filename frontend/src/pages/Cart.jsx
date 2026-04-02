import { X, Plus, Minus, Heart, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

const Cart = () => {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const [agreed, setAgreed] = useState(false);
  const shipping = items.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-6 mb-8 border-b border-foreground/10 pb-4">
          <h1 className="text-sm font-black uppercase tracking-wider">Shopping Bag</h1>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Heart className="w-4 h-4" />
            <span className="uppercase tracking-wider">Favourites</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            {items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">Your shopping bag is empty</p>
                <Link to="/products" className="text-sm font-bold underline">Continue Shopping</Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 w-full sm:w-auto">
                    <div className="relative rounded-xl overflow-hidden bg-secondary/30 w-[200px] sm:w-[280px]">
                      <img src={item.image} alt={item.name} className="w-full h-[260px] sm:h-[360px] object-cover" />
                      <button className="absolute bottom-3 right-3 p-1.5 bg-background/80 rounded-md">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <button onClick={() => removeItem(item.id)} className="self-end" aria-label="Remove">
                        <X className="w-4 h-4" />
                      </button>
                      <div>
                        <p className="text-sm font-bold">{item.size}</p>
                        <div className="w-8 h-8 bg-foreground rounded-md mt-1" />
                      </div>
                      <div className="flex flex-col items-center gap-1 border border-foreground/20 rounded-md">
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1">
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1">
                          <Minus className="w-3 h-3" />
                        </button>
                      </div>
                      <button className="p-1" aria-label="Refresh">
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="hidden sm:block mt-auto pb-1">
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                      <div className="flex items-center justify-between gap-6">
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-sm font-bold">₹ {item.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="lg:w-[320px]">
              <div className="border border-foreground/10 rounded-xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider mb-6">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-bold">₹{shipping}</span>
                  </div>
                </div>
                <div className="border-t border-foreground/10 mt-4 pt-4 flex justify-between text-sm">
                  <span className="font-black uppercase">Total <span className="font-normal text-muted-foreground">(Tax incl.)</span></span>
                  <span className="text-lg font-black">₹{total}</span>
                </div>

                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 rounded border-foreground/20"
                  />
                  <span className="text-xs">I agree to the Terms and Conditions</span>
                </label>

                <Link
                  to={agreed ? "/checkout" : "#"}
                  onClick={(e) => { if (!agreed) e.preventDefault(); }}
                  className={`block w-full text-center uppercase tracking-wider font-bold py-4 rounded-md mt-4 transition-colors ${
                    agreed
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-secondary/60 text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Continue
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
