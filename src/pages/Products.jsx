import { Search, ChevronRight, ChevronDown, SlidersHorizontal, X, Star } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { productApi } from "@/lib/api";

const SIZES   = ["XS", "S", "M", "L", "XL", "2X"];
const COLORS  = ["Red", "Blue", "Black", "White", "Green", "Yellow", "Gray"];
const SORT_OPTIONS = [
  { label: "Newest",      value: "newest"     },
  { label: "Price: Low",  value: "price_asc"  },
  { label: "Price: High", value: "price_desc" },
  { label: "Top Rated",   value: "rating"     },
];

const CATEGORIES = [
  { label: "All",   value: ""      },
  { label: "Men",   value: "men"   },
  { label: "Women", value: "women" },
  { label: "Kids",  value: "kids"  },
];

// Skeleton card for loading state
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="rounded-xl bg-secondary/40 w-full h-[300px] md:h-[380px] mb-3" />
    <div className="h-3 bg-secondary/40 rounded w-1/3 mb-2" />
    <div className="h-4 bg-secondary/40 rounded w-2/3" />
  </div>
);

const Products = () => {
  const [products, setProducts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showFilters, setShowFilters] = useState(false); // mobile drawer

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    keyword:  "",
    category: "",
    minPrice: "",
    maxPrice: "",
    size:     "",
    color:    "",
    inStock:  false,
    minRating:"",
    sort:     "newest",
  });

  const setFilter = (key, value) =>
    setFilters((p) => ({ ...p, [key]: value }));

  const clearFilters = () =>
    setFilters({ keyword: "", category: "", minPrice: "", maxPrice: "", size: "", color: "", inStock: false, minRating: "", sort: "newest" });

  // ── Fetch products whenever filters change ─────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        ...(filters.keyword   && { keyword:   filters.keyword   }),
        ...(filters.category  && { category:  filters.category  }),
        ...(filters.minPrice  && { minPrice:  filters.minPrice  }),
        ...(filters.maxPrice  && { maxPrice:  filters.maxPrice  }),
        ...(filters.size      && { size:      filters.size      }),
        ...(filters.color     && { color:     filters.color     }),
        ...(filters.inStock   && { inStock:   "true"            }),
        ...(filters.minRating && { minRating: filters.minRating }),
        sort: filters.sort,
      };
      const data = await productApi.getAll(params);
      setProducts(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Debounce keyword search by 400ms, others instant
    const timer = setTimeout(fetchProducts, filters.keyword ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // ── Active filter count badge ──────────────────────────────────────────────
  const activeCount = [
    filters.category, filters.minPrice, filters.maxPrice,
    filters.size, filters.color, filters.inStock, filters.minRating,
  ].filter(Boolean).length;

  // ── Sidebar filter panel (shared between desktop & mobile drawer) ──────────
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* In Stock */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setFilter("inStock", !filters.inStock)}
            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
              filters.inStock ? "bg-foreground" : "bg-foreground/20"
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-all ${
              filters.inStock ? "left-5" : "left-0.5"
            }`} />
          </div>
          <span className="text-sm font-medium">In Stock Only</span>
        </label>
      </div>

      {/* Category */}
      <div className="border-t border-dashed border-foreground/10 pt-5">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Category</h3>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter("category", filters.category === c.value ? "" : c.value)}
              className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${
                filters.category === c.value
                  ? "bg-foreground text-background font-bold"
                  : "hover:bg-secondary/60"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="border-t border-dashed border-foreground/10 pt-5">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter("size", filters.size === s ? "" : s)}
              className={`w-10 h-10 border rounded-md text-sm font-medium transition-colors ${
                filters.size === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 hover:bg-foreground hover:text-background"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="border-t border-dashed border-foreground/10 pt-5">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Color</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setFilter("color", filters.color === c ? "" : c)}
              className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-colors ${
                filters.color === c
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 hover:bg-foreground hover:text-background"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t border-dashed border-foreground/10 pt-5">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Price Range (₹)</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => setFilter("minPrice", e.target.value)}
            className="w-full border border-foreground/15 rounded-md px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-foreground/40"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => setFilter("maxPrice", e.target.value)}
            className="w-full border border-foreground/15 rounded-md px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-foreground/40"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="border-t border-dashed border-foreground/10 pt-5">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Min Rating</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setFilter("minRating", filters.minRating === String(r) ? "" : String(r))}
              className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                filters.minRating === String(r)
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 hover:bg-secondary"
              }`}
            >
              <Star className="w-3 h-3" fill={filters.minRating === String(r) ? "currentColor" : "none"} />
              {r}+
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {activeCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full border border-foreground/20 rounded-md py-2.5 text-sm font-medium hover:bg-secondary/60 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="relative ml-auto w-[300px] h-full bg-background overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Filters {activeCount > 0 && <span className="ml-2 text-xs bg-foreground text-background rounded-full px-2 py-0.5">{activeCount}</span>}</h2>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      <main className="px-6 md:px-8 py-6">
        <div className="flex gap-8 lg:gap-12">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block min-w-[220px] max-w-[250px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              {activeCount > 0 && (
                <span className="text-xs bg-foreground text-background rounded-full px-2 py-0.5 font-bold">
                  {activeCount}
                </span>
              )}
            </div>
            <FilterPanel />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <p className="text-sm text-muted-foreground mb-1">
              Home / <span className="text-foreground">Products</span>
            </p>
            <div className="flex items-center justify-between mb-6">
              <h1
                className="text-3xl md:text-4xl font-black uppercase"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                PRODUCTS
                {!loading && (
                  <span className="text-base ml-3 font-normal text-muted-foreground normal-case">
                    {total} items
                  </span>
                )}
              </h1>
            </div>

            {/* Search + Sort + Mobile filter toggle */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={filters.keyword}
                  onChange={(e) => setFilter("keyword", e.target.value)}
                  className="w-full bg-secondary/60 border-none rounded-lg pl-11 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
              </div>

              <div className="flex gap-2">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilter("sort", e.target.value)}
                    className="appearance-none bg-secondary/60 border-none rounded-lg pl-4 pr-10 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-foreground/20 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                </div>

                {/* Mobile filter toggle */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 bg-secondary/60 rounded-lg px-4 py-3 text-sm font-medium"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeCount > 0 && (
                    <span className="bg-foreground text-background rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFilter("category", filters.category === c.value ? "" : c.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    filters.category === c.value
                      ? "bg-foreground text-background border-foreground"
                      : "border-foreground/20 hover:bg-foreground hover:text-background"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
                {error} — <button onClick={fetchProducts} className="underline font-medium">Retry</button>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : products.length === 0
                  ? (
                    <div className="col-span-full text-center py-20">
                      <p className="text-muted-foreground mb-2">No products found.</p>
                      <button onClick={clearFilters} className="text-sm font-bold underline">
                        Clear filters
                      </button>
                    </div>
                  )
                  : products.map((product) => (
                    <Link
                      to={`/product/${product._id}`}
                      key={product._id}
                      className="group cursor-pointer"
                    >
                      <div className="rounded-xl overflow-hidden mb-3 bg-secondary/30 relative">
                        <img
                          src={product.images?.[0]?.url}
                          alt={product.images?.[0]?.altText || product.name}
                          className="w-full h-[300px] md:h-[380px] object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/400x500/f5f5f5/999?text=No+Image";
                          }}
                        />
                        {product.salePrice && product.basePrice > product.salePrice && (
                          <span className="absolute top-3 left-3 bg-foreground text-background text-xs font-bold px-2 py-1 rounded-md">
                            {Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)}% OFF
                          </span>
                        )}
                        {product.averageRating > 0 && (
                          <span className="absolute top-3 right-3 bg-background/90 text-foreground text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-foreground" />
                            {product.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                          <p className="text-sm font-medium">{product.name}</p>
                          {product.brand && (
                            <p className="text-xs text-muted-foreground">{product.brand}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {product.salePrice && product.salePrice < product.basePrice ? (
                            <>
                              <p className="text-sm font-bold">₹{product.salePrice}</p>
                              <p className="text-xs text-muted-foreground line-through">₹{product.basePrice}</p>
                            </>
                          ) : (
                            <p className="text-sm font-bold">₹{product.basePrice}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
              }
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;