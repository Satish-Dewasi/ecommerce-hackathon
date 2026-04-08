import { X, Plus, Minus, Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

const Cart = () => {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const [agreed, setAgreed] = useState(false);

  const shipping = items.length > 0 ? 99 : 0;
  const total    = subtotal + shipping;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-8 border-b border-foreground/10 pb-4">
          <h1 className="text-sm font-black uppercase tracking-wider border-b-2 border-foreground pb-4 -mb-4">
            Shopping Bag {items.length > 0 && <span className="ml-1 text-muted-foreground">({items.length})</span>}
          </h1>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pb-4 -mb-4">
            <Heart className="w-4 h-4" />
            <span className="uppercase tracking-wider">Wishlist</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Cart Items ─────────────────────────────────────────────────── */}
          <div className="flex-1">
            {items.length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
                <p className="text-muted-foreground mb-2">Your shopping bag is empty</p>
                <Link to="/products" className="text-sm font-bold underline underline-offset-4 mt-2">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id + (item.variantSku || "")}
                    className="flex gap-4 border-b border-foreground/5 pb-6"
                  >
                    {/* Product image */}
                    <div className="relative rounded-xl overflow-hidden bg-secondary/30 shrink-0 w-[120px] sm:w-[160px]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-[150px] sm:h-[200px] object-cover"
                        onError={(e) => { e.target.src = "https://placehold.co/160x200/f5f5f5/999?text=·"; }}
                      />
                      <button className="absolute bottom-2 right-2 p-1.5 bg-background/80 rounded-md hover:bg-background transition-colors">
                        <Heart className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{item.name}</p>
                          {item.variantSku && (
                            <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.variantSku}</p>
                          )}
                          {(item.color || item.size) && (
                            <p className="text-xs text-muted-foreground">
                              {[item.color, item.size].filter(Boolean).join(" / ")}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          aria-label="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity control */}
                        <div className="flex items-center border border-foreground/20 rounded-md overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 hover:bg-secondary/60 transition-colors"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-4 text-sm font-bold border-x border-foreground/10">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2 hover:bg-secondary/60 transition-colors"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="text-sm font-black">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Clear cart */}
                <button
                  onClick={clearCart}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  Clear cart
                </button>
              </div>
            )}
          </div>

          {/* ── Order Summary ─────────────────────────────────────────────── */}
          {items.length > 0 && (
            <div className="lg:w-[320px] shrink-0">
              <div className="border border-foreground/10 rounded-2xl p-6 sticky top-6">
                <h2 className="text-sm font-black uppercase tracking-wider mb-6">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-bold">₹{shipping}</span>
                  </div>
                </div>

                <div className="border-t border-foreground/10 mt-5 pt-5 flex justify-between">
                  <span className="text-sm font-black uppercase">
                    Total
                    <span className="block text-xs font-normal text-muted-foreground normal-case">Tax incl.</span>
                  </span>
                  <span className="text-2xl font-black">₹{total.toLocaleString()}</span>
                </div>

                <label className="flex items-start gap-3 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-foreground/20 accent-foreground"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I agree to the{" "}
                    <a href="#" className="underline text-foreground">Terms and Conditions</a>
                  </span>
                </label>

                <Link
                  to={agreed ? "/checkout" : "#"}
                  onClick={(e) => { if (!agreed) e.preventDefault(); }}
                  className={`block w-full text-center uppercase tracking-wider font-bold py-4 rounded-md mt-4 transition-all ${
                    agreed
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-secondary/40 text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Proceed to Checkout
                </Link>

                <Link
                  to="/products"
                  className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
                >
                  ← Continue Shopping
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