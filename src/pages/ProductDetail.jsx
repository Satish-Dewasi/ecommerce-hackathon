import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Star, ShoppingBag, Check } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { productApi, wishlistApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProductDetail = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { addItem }   = useCart();
  const { isLoggedIn } = useAuth();

  const [product, setProduct]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null); // full variant object
  const [added, setAdded]             = useState(false);
  const [wishlisted, setWishlisted]   = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ── Fetch product ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError("");
    productApi.getById(id)
      .then((data) => {
        // API returns data as array — always read data[0]
        const p = data.data?.[0];
        if (!p) { setError("Product not found."); return; }
        setProduct(p);
        // Default to first variant if available
        if (p.variants?.length) setSelectedVariant(p.variants[0]);
      })
      .catch((err) => setError(err.message || "Failed to load product."))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Derive available images (product + selected variant) ─────────────────
  const allImages = product
    ? [
        ...(product.images || []),
        ...(selectedVariant?.images || []),
      ]
    : [];

  // ── Unique colors and sizes from variants ─────────────────────────────────
  const uniqueColors = product
    ? [...new Set(product.variants?.map((v) => v.color).filter(Boolean))]
    : [];
  const uniqueSizes = product
    ? [...new Set(product.variants?.map((v) => v.size).filter(Boolean))]
    : [];

  const selectedColor = selectedVariant?.color || "";
  const selectedSize  = selectedVariant?.size  || "";

  const selectVariant = (color, size) => {
    const match = product.variants?.find(
      (v) => v.color === (color || selectedColor) && v.size === (size || selectedSize)
    ) || product.variants?.find(
      (v) => v.color === (color || selectedColor)
    ) || product.variants?.find(
      (v) => v.size === (size || selectedSize)
    );
    if (match) setSelectedVariant(match);
  };

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!product) return;
    addItem({
      id:         product._id,
      variantSku: selectedVariant?.sku,
      image:      allImages[0]?.url || "",
      type:       product.category,
      name:       product.name,
      price:      selectedVariant?.price ?? product.salePrice ?? product.basePrice,
      color:      selectedColor,
      size:       selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // ── Wishlist toggle ────────────────────────────────────────────────────────
  const handleWishlist = async () => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    setWishlistLoading(true);
    try {
      await wishlistApi.toggle(product._id);
      setWishlisted((p) => !p);
    } catch { /* silent */ } finally {
      setWishlistLoading(false);
    }
  };

  // ── Price to display ──────────────────────────────────────────────────────
  const displayPrice = selectedVariant?.price ?? product?.salePrice ?? product?.basePrice ?? 0;
  const originalPrice = product?.basePrice ?? 0;
  const hasDiscount   = originalPrice > displayPrice;

  if (loading) return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="hidden md:block"><Navbar /></div>
      <div className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12 animate-pulse">
          <div className="flex-1 bg-secondary/30 rounded-2xl h-[500px]" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-secondary/30 rounded w-3/4" />
            <div className="h-5 bg-secondary/30 rounded w-1/4" />
            <div className="h-4 bg-secondary/30 rounded w-full" />
            <div className="h-4 bg-secondary/30 rounded w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">{error}</p>
      <Link to="/products" className="text-sm font-bold underline">← Back to Products</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Navbar */}
      <div className="hidden md:block"><Navbar /></div>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-foreground/10">
        <button onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link to="/cart">
          <ShoppingBag className="w-5 h-5" />
        </Link>
      </div>

      <main className="px-4 md:px-8 py-4 md:py-12">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 max-w-6xl mx-auto">

          {/* ── Image Gallery ─────────────────────────────────────────────── */}
          <div className="flex flex-col-reverse md:flex-row gap-4 flex-1">
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`min-w-[60px] w-[60px] h-[75px] md:w-[80px] md:h-[100px] rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || ""}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "https://placehold.co/80x100/f5f5f5/999?text=·"; }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 rounded-2xl overflow-hidden bg-secondary/30 relative">
              {allImages[selectedImage] ? (
                <img
                  src={allImages[selectedImage]?.url}
                  alt={allImages[selectedImage]?.altText || product.name}
                  className="w-full h-[400px] md:h-[600px] object-cover transition-opacity duration-300"
                  onError={(e) => { e.target.src = "https://placehold.co/600x700/f5f5f5/999?text=No+Image"; }}
                />
              ) : (
                <div className="w-full h-[400px] md:h-[600px] flex items-center justify-center text-muted-foreground text-sm">
                  No image available
                </div>
              )}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-foreground text-background text-xs font-bold px-2.5 py-1.5 rounded-md">
                  {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
                </span>
              )}
            </div>
          </div>

          {/* ── Product Info ───────────────────────────────────────────────── */}
          <div className="flex-1 max-w-md">
            <div className="border border-foreground/10 rounded-2xl p-6 md:p-8">

              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 pr-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider capitalize mb-1">
                    {product.brand || product.category}
                  </p>
                  <h1 className="text-xl font-black uppercase tracking-wide leading-tight">
                    {product.name}
                  </h1>
                </div>
                <button
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  aria-label="Wishlist"
                  className="p-2 shrink-0"
                >
                  <Heart
                    className="w-5 h-5 transition-colors"
                    fill={wishlisted ? "currentColor" : "none"}
                  />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-2xl font-black">₹{displayPrice}</p>
                {hasDiscount && (
                  <p className="text-sm text-muted-foreground line-through">₹{originalPrice}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">MRP incl. of all taxes</p>

              {/* Rating */}
              {product.averageRating > 0 && (
                <div className="flex items-center gap-1.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5"
                      fill={i < Math.round(product.averageRating) ? "currentColor" : "none"}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground">
                    {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)
                  </span>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              {/* Color selector */}
              {uniqueColors.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2">
                    Color: <span className="font-normal normal-case">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map((c) => (
                      <button
                        key={c}
                        onClick={() => selectVariant(c, selectedSize)}
                        className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-colors ${
                          selectedColor === c
                            ? "bg-foreground text-background border-foreground"
                            : "border-foreground/20 hover:bg-secondary"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {uniqueSizes.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Size: <span className="font-normal normal-case">{selectedSize}</span>
                    </p>
                    <button className="text-xs text-muted-foreground underline hover:text-foreground">
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueSizes.map((s) => {
                      const variant = product.variants?.find(
                        (v) => v.size === s && v.color === selectedColor
                      ) || product.variants?.find((v) => v.size === s);
                      const outOfStock = variant?.stock === 0;
                      return (
                        <button
                          key={s}
                          onClick={() => !outOfStock && selectVariant(selectedColor, s)}
                          disabled={outOfStock}
                          className={`w-12 h-12 border rounded-md text-sm font-medium transition-colors relative ${
                            selectedSize === s
                              ? "bg-foreground text-background border-foreground"
                              : outOfStock
                                ? "border-foreground/10 text-foreground/30 cursor-not-allowed line-through"
                                : "border-foreground/20 hover:bg-foreground hover:text-background"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock info */}
              {selectedVariant && (
                <p className={`text-xs mb-5 font-medium ${
                  selectedVariant.stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
                }`}>
                  {selectedVariant.stock > 0
                    ? `${selectedVariant.stock} in stock`
                    : "Out of stock"}
                </p>
              )}

              {/* Add button */}
              <button
                onClick={handleAdd}
                disabled={selectedVariant?.stock === 0}
                className={`w-full font-bold uppercase tracking-wider py-4 rounded-md transition-all flex items-center justify-center gap-2 ${
                  added
                    ? "bg-green-600 text-white"
                    : selectedVariant?.stock === 0
                      ? "bg-secondary/40 text-muted-foreground cursor-not-allowed"
                      : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                {added ? (
                  <><Check className="w-4 h-4" /> Added to Bag</>
                ) : selectedVariant?.stock === 0 ? (
                  "Out of Stock"
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Add to Bag</>
                )}
              </button>

              {/* SKU */}
              {selectedVariant?.sku && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  SKU: {selectedVariant.sku}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="hidden md:block"><Footer /></div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground/10">
        <button
          onClick={handleAdd}
          disabled={selectedVariant?.stock === 0}
          className={`w-full font-bold uppercase tracking-wider py-4 rounded-md transition-all flex items-center justify-center gap-2 ${
            added
              ? "bg-green-600 text-white"
              : selectedVariant?.stock === 0
                ? "bg-secondary/40 text-muted-foreground cursor-not-allowed"
                : "bg-foreground text-background hover:opacity-90"
          }`}
        >
          {added ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingBag className="w-4 h-4" /> Add to Bag</>}
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;