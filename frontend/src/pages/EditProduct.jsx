import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import ProductForm from "@/components/ProductForm";
import { productApi } from "@/lib/api";

const EditProduct = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    productApi.getById(id)
      .then((data) => {
        const p = data.data?.[0];
        if (!p) { setError("Product not found."); return; }
        setProduct(p);
      })
      .catch((err) => setError(err.message || "Failed to load product."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading product…</span>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
      <button
        onClick={() => navigate("/seller")}
        className="text-sm underline underline-offset-4 hover:opacity-70 transition-opacity"
      >
        ← Back to Dashboard
      </button>
    </div>
  );

  return <ProductForm mode="edit" initialData={product} productId={id} />;
};

export default EditProduct;