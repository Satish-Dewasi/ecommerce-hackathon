import { Search, ArrowRight, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
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

const newThisWeekProducts = [
  { image: productSeersucker, type: "Cotton T-Shirt", name: "Embroidered Seersucker Shirt", price: 199 },
  { image: productWhiteTee, type: "Cotton T-Shirt", name: "Basic Slim Fit T-Shirt", price: 149 },
  { image: productHenley, type: "Henley T-Shirt", name: "Blurred Print T-Shirt", price: 129 },
  { image: productCreamTee, type: "Overweight T-Shirt", name: "Full Sleeve Zipper", price: 199 },
];

const collectionProducts = [
  { image: productSeersucker, type: "Cotton T-Shirt", name: "Basic Heavy Weight T-Shirt", price: 199 },
  { image: productJeans, type: "Cotton Jeans", name: "Soft Wash Straight Fit Jeans", price: 199 },
  { image: productCamo, type: "Cotton T-Shirt", name: "Basic Heavy Weight T-Shirt", price: 150 },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <div className="px-6 md:px-8 pt-4 pb-8">
          <div className="flex gap-12 lg:gap-20">
            {/* Left sidebar: Categories + Search */}
            <aside className="hidden lg:flex flex-col justify-between py-8 min-w-[140px]">
              <div className="flex flex-col gap-4">
                <a href="#" className="text-sm font-bold tracking-[0.2em] hover:opacity-70 transition-opacity">MEN</a>
                <a href="#" className="text-sm font-bold tracking-[0.2em] hover:opacity-70 transition-opacity">WOMEN</a>
                <a href="#" className="text-sm font-bold tracking-[0.2em] hover:opacity-70 transition-opacity">KIDS</a>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-secondary/60 border-none rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
              </div>
            </aside>

            {/* Mobile Categories + Search */}
            <div className="lg:hidden flex-1">
              <div className="flex flex-col gap-2 mb-4">
                <a href="#" className="text-sm font-bold tracking-[0.2em]">MEN</a>
                <a href="#" className="text-sm font-bold tracking-[0.2em]">WOMEN</a>
                <a href="#" className="text-sm font-bold tracking-[0.2em]">KIDS</a>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-secondary/60 border-none rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Search</span>
              </div>

              <div className="mb-6">
                <h1
                  className="text-6xl sm:text-7xl font-black uppercase leading-[0.85] tracking-tight"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  NEW<br />COLLECTION
                </h1>
                <p className="text-sm text-muted-foreground mt-3">Summer<br />2026</p>
              </div>

              {/* Mobile product cards - horizontal scroll */}
              <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
                {[
                  { image: modelHoodie, type: "Cotton T Shirt", name: "Full Sleeve Zipper", price: 199 },
                  { image: modelTshirt, type: "Cotton T Shirt", name: "Full Sleeve Zipper", price: 199 },
                  { image: productCreamTee, type: "Cotton T Shirt", name: "Full Sleeve Zipper", price: 199 },
                ].map((product, i) => (
                  <div key={i} className="min-w-[160px] snap-start">
                    <div className="rounded-xl overflow-hidden mb-2">
                      <img src={product.image} alt={product.name} className="w-full h-[180px] object-cover" />
                    </div>
                    <p className="text-xs text-muted-foreground">{product.type}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{product.name}</p>
                      <p className="text-xs font-bold">${product.price}</p>
                    </div>
                  </div>
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

              <div className="flex gap-4 md:gap-6">
                <div className="flex-1 rounded-2xl overflow-hidden max-w-[320px]">
                  <img src={modelHoodie} alt="Model wearing white hoodie" className="w-full h-[400px] md:h-[480px] object-cover" />
                </div>
                <div className="flex-1 rounded-2xl overflow-hidden max-w-[280px]">
                  <img src={modelTshirt} alt="Model wearing black t-shirt" className="w-full h-[400px] md:h-[480px] object-cover" />
                </div>
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

        {/* New This Week Section */}
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-2">
              <h2
                className="text-5xl md:text-6xl font-black uppercase leading-[0.9]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                NEW<br />THIS WEEK
              </h2>
              <span className="text-xs font-bold bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center mt-1">50</span>
            </div>
            <Link to="/products" className="text-sm font-medium hover:opacity-70 transition-opacity">See All</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newThisWeekProducts.map((product, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="rounded-xl overflow-hidden mb-3 bg-secondary/40">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-[220px] md:h-[300px] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{product.type}</p>
                    <p className="text-sm font-medium">{product.name}</p>
                  </div>
                  <p className="text-sm font-bold">$ {product.price}</p>
                </div>
              </div>
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

        {/* XIV Collections Section */}
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <h2
              className="text-5xl md:text-6xl font-black uppercase leading-[0.9] mb-4 md:mb-0"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              TEAM 6<br />COLLECTIONS<br />25-26
            </h2>
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className="text-sm underline cursor-pointer">Filter(s)</span>
              <div className="flex gap-2 text-xs">
                <span className="text-sm">6 in East</span>
                <span className="text-sm text-muted-foreground">| Most To Least</span>
                <span className="text-sm text-muted-foreground">| More to Less</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {["{ALL}", "Men", "Women", "KID"].map((tab, i) => (
              <button
                key={tab}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${i === 0 ? "bg-foreground text-background" : "border border-foreground/20 hover:bg-foreground hover:text-background transition-colors"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {collectionProducts.map((product, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="rounded-xl overflow-hidden mb-3 bg-secondary/40">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-[220px] md:h-[340px] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{product.type}</p>
                    <p className="text-sm font-medium">{product.name}</p>
                  </div>
                  <p className="text-sm font-bold">$ {product.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center mt-8 gap-1">
            <span className="text-sm text-muted-foreground">View</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </section>

        {/* Our Approach Section */}
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
              fashion that transcends trends and defies the norm. Each of the realm
              design is meticulously crafted, ensuring the highest quality
              excellence in finish.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[editorial1, editorial2, editorial3, editorial4].map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <img
                  src={img}
                  alt={`Editorial ${i + 1}`}
                  className="w-full h-[200px] md:h-[320px] object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
