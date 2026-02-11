import { Search, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import productBeigeTee from "@/assets/product-beige-tee.jpg";
import productBlackCrew from "@/assets/product-black-crew.jpg";
import productCamo from "@/assets/product-camo.jpg";
import productSeersucker from "@/assets/product-seersucker.jpg";
import productWhiteTee from "@/assets/product-white-tee.jpg";
import productHenley from "@/assets/product-henley.jpg";
import productCreamTee from "@/assets/product-cream-tee.jpg";
import productJeans from "@/assets/product-jeans.jpg";
import modelHoodie from "@/assets/model-hoodie.jpg";

const categories = ["NEW", "SHIRTS", "POLO SHIRTS", "SHORTS", "SUITS", "BEST SELLERS", "T-SHIRTS", "JEANS", "JACKETS", "COATS"];
const sizes = ["XS", "S", "M", "L", "XL", "2X"];

const filterSections = [
  { name: "Category", expandable: true },
  { name: "Colors", expandable: true },
  { name: "Price Range", expandable: true },
  { name: "Collections", expandable: true },
  { name: "Tags", expandable: true },
  { name: "Ratings", expandable: true },
];

const products = [
  { image: productBeigeTee, type: "Cotton T Shirt", name: "Basic Slim Fit T-Shirt", price: 199, colors: ["bg-secondary", "+5"] },
  { image: productBlackCrew, type: "Crewneck T-Shirt", name: "Basic Heavy Weight T-Shirt", price: 199, colors: ["bg-foreground", "+6"] },
  { image: productCamo, type: "Cotton T Shirt", name: "Full Sleeve Zipper", price: 199, colors: [] },
  { image: productSeersucker, type: "Cotton T-Shirt", name: "Embroidered Seersucker Shirt", price: 199, colors: [] },
  { image: productWhiteTee, type: "Cotton T-Shirt", name: "Basic Slim Fit T-Shirt", price: 149, colors: [] },
  { image: productHenley, type: "Henley T-Shirt", name: "Blurred Print T-Shirt", price: 129, colors: [] },
  { image: productCreamTee, type: "Cotton T-Shirt", name: "Full Sleeve Zipper", price: 199, colors: [] },
  { image: productJeans, type: "Cotton Jeans", name: "Soft Wash Straight Fit", price: 199, colors: [] },
  { image: modelHoodie, type: "Cotton Hoodie", name: "Classic White Hoodie", price: 249, colors: [] },
];

const Products = () => {
  const [activeCategory, setActiveCategory] = useState("NEW");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="px-6 md:px-8 py-6">
        <div className="flex gap-8 lg:gap-12">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block min-w-[220px] max-w-[250px]">
            <h2 className="text-2xl font-bold mb-6">Filters</h2>

            {/* Size */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className="w-10 h-10 border border-foreground/20 rounded-md flex items-center justify-center text-sm font-medium hover:bg-foreground hover:text-background transition-colors"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6 border-t border-dashed border-foreground/10 pt-4">
              <button className="flex items-center justify-between w-full mb-3">
                <h3 className="text-lg font-bold">Availability</h3>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-foreground/20" />
                  <span className="text-sm">Availability</span>
                  <span className="text-sm text-primary ml-auto">(450)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-foreground/20" />
                  <span className="text-sm">Out Of Stack</span>
                  <span className="text-sm text-primary ml-auto">(18)</span>
                </label>
              </div>
            </div>

            {/* Expandable filter sections */}
            {filterSections.map((section) => (
              <div key={section.name} className="mb-4 border-t border-dashed border-foreground/10 pt-4">
                <button className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-bold">{section.name}</h3>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Breadcrumb */}
            <p className="text-sm text-muted-foreground mb-1">
              Home / <span className="text-foreground">Products</span>
            </p>
            <h1
              className="text-3xl md:text-4xl font-black uppercase mb-6"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              PRODUCTS
            </h1>

            {/* Search + Category Tags */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-secondary/60 border-none rounded-lg pl-12 pr-20 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Search</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap border transition-colors ${
                      activeCategory === cat
                        ? "bg-foreground text-background border-foreground"
                        : "border-foreground/20 hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product, i) => (
                <Link to={`/product/${i + 1}`} key={i} className="group cursor-pointer">
                  <div className="rounded-xl overflow-hidden mb-3 bg-secondary/30">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-[300px] md:h-[380px] object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{product.type}</p>
                        {product.colors.length > 0 && (
                          <div className="flex items-center gap-1">
                            {product.colors.map((c, j) =>
                              c.startsWith("+") ? (
                                <span key={j} className="text-xs text-muted-foreground">{c}</span>
                              ) : (
                                <span key={j} className={`w-3 h-3 rounded-sm ${c}`} />
                              )
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium">{product.name}</p>
                    </div>
                    <p className="text-sm font-bold">₹ {product.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
