import { useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import productBlackCrew from "@/assets/product-black-crew.jpg";
import productCamo from "@/assets/product-camo.jpg";
import productBeigeTee from "@/assets/product-beige-tee.jpg";
import productSeersucker from "@/assets/product-seersucker.jpg";
import productWhiteTee from "@/assets/product-white-tee.jpg";

const allProducts = [
  { id: 1, name: "Abstract Print Shirt", type: "Cotton T Shirt", price: 99, description: "Relaxed-fit shirt. Camp collar and short sleeves. Button-up front.", images: [productBlackCrew, productCamo, productBeigeTee, productSeersucker, productWhiteTee] },
  { id: 2, name: "Basic Heavy Weight T-Shirt", type: "Crewneck T-Shirt", price: 199, description: "Premium heavyweight cotton. Relaxed fit with ribbed crew neck.", images: [productCamo, productBlackCrew, productBeigeTee, productSeersucker, productWhiteTee] },
  { id: 3, name: "Basic Slim Fit T-Shirt", type: "Cotton T-Shirt", price: 149, description: "Slim fit cotton tee. Soft hand feel with clean finish.", images: [productWhiteTee, productBlackCrew, productBeigeTee, productSeersucker, productCamo] },
];

const colors = [
  { name: "Gray", value: "bg-gray-400" },
  { name: "Taupe", value: "bg-stone-400" },
  { name: "Black", value: "bg-black" },
  { name: "Mint", value: "bg-emerald-300" },
  { name: "White", value: "bg-white border border-foreground/20" },
  { name: "Lavender", value: "bg-indigo-200" },
];

const sizes = ["XS", "S", "M", "L", "XL", "2X"];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const product = allProducts.find((p) => p.id === Number(id)) || allProducts[0];
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedSize, setSelectedSize] = useState("M");

  const handleAdd = () => {
    addItem({
      id: product.id,
      image: product.images[0],
      type: product.type,
      name: product.name,
      price: product.price,
      color: selectedColor,
      size: selectedSize,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop: show Navbar, Mobile: show back arrow */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="md:hidden flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2" aria-label="Cart">
            <span className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs">🛒</span>
          </button>
          <button className="p-2" aria-label="Profile">
            <span className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs">👤</span>
          </button>
        </div>
      </div>

      <main className="px-4 md:px-8 py-4 md:py-12">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 max-w-6xl mx-auto">
          {/* Images */}
          <div className="flex flex-col-reverse md:flex-row gap-4 flex-1">
            {/* Thumbnails - horizontal on mobile, vertical on desktop */}
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`min-w-[60px] w-[60px] h-[75px] md:w-[80px] md:h-[100px] rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? "border-foreground" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {/* Main image */}
            <div className="flex-1 rounded-xl overflow-hidden bg-secondary/30">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-[400px] md:h-[600px] object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 max-w-md">
            <div className="border border-foreground/10 rounded-xl p-6 md:p-8">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wide">{product.name}</h1>
                  <p className="text-lg font-bold mt-1">₹{product.price}</p>
                </div>
                <button className="p-2" aria-label="Favourite">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">MRP incl. of all taxes</p>
              <p className="text-sm font-bold leading-relaxed mb-6">{product.description}</p>

              {/* Color */}
              <div className="mb-6">
                <p className="text-sm font-medium tracking-wider mb-3">Color</p>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-10 h-10 rounded-md ${c.value} ${
                        selectedColor === c.name ? "ring-2 ring-foreground ring-offset-2" : ""
                      }`}
                      aria-label={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="mb-4">
                <p className="text-sm font-medium tracking-wider mb-3">Size</p>
                <div className="flex gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-11 h-11 border rounded-md text-sm font-medium transition-colors ${
                        selectedSize === s
                          ? "bg-foreground text-background border-foreground"
                          : "border-foreground/20 hover:bg-foreground hover:text-background"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground uppercase tracking-wider mb-6">
                <span className="cursor-pointer hover:text-foreground">Find Your Size</span>
                <span>|</span>
                <span className="cursor-pointer hover:text-foreground">Measurement Guide</span>
              </div>

              <button
                onClick={handleAdd}
                className="w-full bg-secondary/60 hover:bg-secondary text-foreground font-bold uppercase tracking-wider py-4 rounded-md transition-colors"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile sticky ADD button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground/10">
        <button
          onClick={handleAdd}
          className="w-full bg-secondary/60 hover:bg-secondary text-foreground font-bold uppercase tracking-wider py-4 rounded-md transition-colors"
        >
          ADD
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
