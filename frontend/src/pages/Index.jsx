import { Search, ArrowRight, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import modelHoodie from "@/assets/model-hoodie.jpg";
import modelTshirt from "@/assets/model-tshirt.jpg";
import productSeersucker from "@/assets/product-seersucker.jpg";
import productWhiteTee from "@/assets/product-white-tee.jpg";
import productHenley from "@/assets/product-henley.jpg";
import productCreamTee from "@/assets/product-cream-tee.jpg";
import productJeans from "@/assets/product-jeans.jpg";
import productCamo from "@/assets/product-camo.jpg";
import editorial1 from "@/assets/editorial-1.jpg";
import editorial2 from "@/assets/editorial-2.jpg";
import editorial3 from "@/assets/editorial-3.jpg";
import editorial4 from "@/assets/editorial-4.jpg";

// ─── Static product data ──────────────────────────────────────────────────────
const newThisWeekProducts = [
  { image: productSeersucker, type: "Cotton T-Shirt",    name: "Embroidered Seersucker Shirt", price: 199, category: "men"   },
  { image: productWhiteTee,   type: "Cotton T-Shirt",    name: "Basic Slim Fit T-Shirt",       price: 149, category: "men"   },
  { image: productHenley,     type: "Henley T-Shirt",    name: "Blurred Print T-Shirt",        price: 129, category: "men"   },
  { image: productCreamTee,   type: "Oversize T-Shirt",  name: "Full Sleeve Zipper",           price: 199, category: "women" },
];

const allCollectionProducts = [
  { image: productSeersucker, type: "Cotton T-Shirt", name: "Basic Heavy Weight T-Shirt",    price: 199, category: "men"   },
  { image: productJeans,      type: "Cotton Jeans",   name: "Soft Wash Straight Fit Jeans",  price: 199, category: "men"   },
  { image: productCamo,       type: "Cotton T-Shirt", name: "Basic Heavy Weight T-Shirt",    price: 150, category: "women" },
  { image: productWhiteTee,   type: "Cotton T-Shirt", name: "Basic Slim Fit White Tee",      price: 149, category: "women" },
  { image: productHenley,     type: "Henley T-Shirt", name: "Kids Printed Henley",           price: 99,  category: "kids"  },
  { image: productCreamTee,   type: "Cotton T-Shirt", name: "Kids Full Sleeve Zipper",       price: 149, category: "kids"  },
];

// Editorial images with category links
const editorialItems = [
  { img: editorial1, label: "Men's Edit",   category: "men"   },
  { img: editorial2, label: "Women's Edit", category: "women" },
  { img: editorial3, label: "Kids' Edit",   category: "kids"  },
  { img: editorial4, label: "New In",       category: ""      },
];

const COLLECTION_TABS = [
  { label: "{ALL}", value: "all"   },
  { label: "Men",   value: "men"   },
  { label: "Women", value: "women" },
  { label: "Kids",  value: "kids"  },
];

// ─── Main component ───────────────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const [collectionTab, setCollectionTab] = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");

  // ── Search submit ────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/products?keyword=${encodeURIComponent(q)}` : "/products");
  };

  // ── Filtered collection products ─────────────────────────────────────────
  const collectionProducts = collectionTab === "all"
    ? allCollectionProducts
    : allCollectionProducts.filter((p) => p.category === collectionTab);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main>
        {/* ── Hero Section ──────────────────────────────────────────────────── */}
        <div className="px-6 md:px-8 pt-4 pb-8">
          <div className="flex gap-12 lg:gap-20">

            {/* Desktop sidebar: Categories + Search */}
            <aside className="hidden lg:flex flex-col justify-between py-8 min-w-[140px]">
              <div className="flex flex-col gap-4">
                <Link
                  to="/products?category=men"
                  className="text-sm font-bold tracking-[0.2em] hover:opacity-70 transition-opacity"
                >
                  MEN
                </Link>
                <Link
                  to="/products?category=women"
                  className="text-sm font-bold tracking-[0.2em] hover:opacity-70 transition-opacity"
                >
                  WOMEN
                </Link>
                <Link
                  to="/products?category=kids"
                  className="text-sm font-bold tracking-[0.2em] hover:opacity-70 transition-opacity"
                >
                  KIDS
                </Link>
              </div>

              {/* Search form */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary/60 border-none rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
              </form>
            </aside>

            {/* Mobile: Categories + Search + Hero */}
            <div className="lg:hidden flex-1">
              <div className="flex gap-4 mb-4">
                <Link to="/products?category=men"   className="text-sm font-bold tracking-[0.2em]">MEN</Link>
                <Link to="/products?category=women" className="text-sm font-bold tracking-[0.2em]">WOMEN</Link>
                <Link to="/products?category=kids"  className="text-sm font-bold tracking-[0.2em]">KIDS</Link>
              </div>

              <form onSubmit={handleSearch} className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary/60 border-none rounded-lg pl-10 pr-16 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
                >
                  Search
                </button>
              </form>

              <div className="mb-6">
                <h1
                  className="text-6xl sm:text-7xl font-black uppercase leading-[0.85] tracking-tight"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  NEW<br />COLLECTION
                </h1>
                <p className="text-sm text-muted-foreground mt-3">Summer<br />2026</p>
              </div>

              {/* Mobile hero product cards */}
              <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
                {[
                  { image: modelHoodie,   type: "Cotton Hoodie",  name: "Full Sleeve Zipper",  price: 199, category: "men"   },
                  { image: modelTshirt,   type: "Cotton T-Shirt", name: "Classic Black Tee",   price: 199, category: "men"   },
                  { image: productCreamTee, type: "Oversize Tee", name: "Full Sleeve Zipper",  price: 199, category: "women" },
                ].map((product, i) => (
                  <Link
                    to={`/products?category=${product.category}`}
                    key={i}
                    className="min-w-[160px] snap-start group"
                  >
                    <div className="rounded-xl overflow-hidden mb-2 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-[180px] object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{product.type}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{product.name}</p>
                      <p className="text-xs font-bold">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <Link to="/products" className="flex items-center gap-4 group mt-4 border border-foreground/20 rounded-full px-5 py-3 w-fit">
                <span className="text-sm font-medium tracking-wide">Go To Shop</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Desktop Hero */}
            <div className="hidden lg:block flex-1">
              <div className="mb-6">
                <p className="text-sm tracking-widest text-muted-foreground mb-2">Summer 2026</p>
                <h1
                  className="text-7xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.85] tracking-tight"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  NEW<br />COLLECTION
                </h1>
              </div>

              <Link to="/products" className="flex items-center gap-4 group mb-10">
                <span className="text-sm font-medium tracking-wide">Go To Shop</span>
                <ArrowRight className="w-12 h-[1px] text-foreground group-hover:translate-x-1 transition-transform" />
                <ArrowRight className="w-4 h-4 -ml-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Hero images — clickable */}
              <div className="flex gap-4 md:gap-6">
                <Link
                  to="/products?category=men"
                  className="flex-1 rounded-2xl overflow-hidden max-w-[320px] group relative"
                >
                  <img
                    src={modelHoodie}
                    alt="Men's collection"
                    className="w-full h-[400px] md:h-[480px] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl" />
                  <span className="absolute bottom-4 left-4 bg-background/90 text-foreground text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Shop Men →
                  </span>
                </Link>
                <Link
                  to="/products?category=men"
                  className="flex-1 rounded-2xl overflow-hidden max-w-[280px] group relative"
                >
                  <img
                    src={modelTshirt}
                    alt="Men's t-shirts"
                    className="w-full h-[400px] md:h-[480px] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl" />
                  <span className="absolute bottom-4 left-4 bg-background/90 text-foreground text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Shop Men →
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center hover:bg-foreground hover:text-background transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center hover:bg-foreground hover:text-background transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── New This Week ──────────────────────────────────────────────────── */}
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-2">
              <h2
                className="text-5xl md:text-6xl font-black uppercase leading-[0.9]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                NEW<br />THIS WEEK
              </h2>
              <span className="text-xs font-bold bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center mt-1">
                {newThisWeekProducts.length}
              </span>
            </div>
            <Link to="/products" className="text-sm font-medium hover:opacity-70 transition-opacity">
              See All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newThisWeekProducts.map((product, i) => (
              <Link
                to={`/products?category=${product.category}`}
                key={i}
                className="group cursor-pointer"
              >
                <div className="rounded-xl overflow-hidden mb-3 bg-secondary/40 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-[220px] md:h-[300px] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background text-foreground text-xs font-bold px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                    Shop Now
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{product.type}</p>
                    <p className="text-sm font-medium group-hover:underline underline-offset-2 transition-all">{product.name}</p>
                  </div>
                  <p className="text-sm font-bold shrink-0">₹{product.price}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-8 justify-center">
            <button className="w-8 h-8 rounded-full border border-foreground/20 flex items-center justify-center hover:bg-foreground hover:text-background transition-colors">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button className="w-8 h-8 rounded-full border border-foreground/20 flex items-center justify-center hover:bg-foreground hover:text-background transition-colors">
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </section>

        {/* ── Collections Section ────────────────────────────────────────────── */}
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <h2
              className="text-5xl md:text-6xl font-black uppercase leading-[0.9] mb-4 md:mb-0"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              TEAM 6<br />COLLECTIONS<br />25-26
            </h2>
            <div className="flex flex-col items-start md:items-end gap-2">
              <Link to="/products" className="text-sm underline hover:opacity-70 transition-opacity">
                View All
              </Link>
              <p className="text-sm text-muted-foreground">
                {collectionProducts.length} items
              </p>
            </div>
          </div>

          {/* Category tabs — functional */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {COLLECTION_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setCollectionTab(tab.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  collectionTab === tab.value
                    ? "bg-foreground text-background"
                    : "border border-foreground/20 hover:bg-foreground hover:text-background"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {collectionProducts.map((product, i) => (
              <Link
                to={`/products?category=${product.category}`}
                key={i}
                className="group cursor-pointer"
              >
                <div className="rounded-xl overflow-hidden mb-3 bg-secondary/40 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-[220px] md:h-[340px] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background text-foreground text-xs font-bold px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                    Shop Now
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{product.type}</p>
                    <p className="text-sm font-medium group-hover:underline underline-offset-2 transition-all">{product.name}</p>
                  </div>
                  <p className="text-sm font-bold shrink-0">₹{product.price}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* View all link */}
          <Link
            to={collectionTab === "all" ? "/products" : `/products?category=${collectionTab}`}
            className="flex flex-col items-center mt-8 gap-1 group"
          >
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">View All</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </section>

        {/* ── Our Approach / Editorial Section ──────────────────────────────── */}
        <section className="px-6 md:px-8 py-12 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              className="text-3xl md:text-4xl font-black uppercase tracking-wide mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              OUR APPROACH TO FASHION DESIGN
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              At elegant venue, we blend creativity with craftsmanship to create
              fashion that transcends trends and defies the norm. Each design is
              meticulously crafted, ensuring the highest quality excellence in finish.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {editorialItems.map((item, i) => (
              <Link
                to={item.category ? `/products?category=${item.category}` : "/products"}
                key={i}
                className="rounded-xl overflow-hidden group relative"
              >
                <img
                  src={item.img}
                  alt={item.label}
                  className="w-full h-[200px] md:h-[320px] object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Label overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span className="block text-white text-xs font-bold bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full w-fit">
                    {item.label} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;