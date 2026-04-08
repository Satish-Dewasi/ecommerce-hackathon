import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  Image as ImageIcon,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

// ─── Shared input class ───────────────────────────────────────────────────────
const INPUT =
  "w-full border border-foreground/15 rounded-lg px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground/50 transition-colors placeholder:text-muted-foreground";
const LABEL =
  "block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5";

// ─── Empty variant template ───────────────────────────────────────────────────
const emptyVariant = () => ({
  sku: "",
  color: "",
  size: "",
  stock: "",
  price: "",
  images: [],
  _imageUrl: "", // temporary field for the image URL input
});

// ─── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div className="border border-foreground/10 rounded-2xl p-6 mb-5">
    <h2 className="text-sm font-black uppercase tracking-widest mb-5">
      {title}
    </h2>
    {children}
  </div>
);

// ─── Main form component ──────────────────────────────────────────────────────
/**
 * Props:
 *   mode        — "add" | "edit"
 *   initialData — product object (for edit mode), undefined for add
 *   productId   — MongoDB _id (for edit mode)
 */
const ProductForm = ({ mode = "add", initialData, productId }) => {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    brand: initialData?.brand || "",
    basePrice: initialData?.basePrice || "",
    salePrice: initialData?.salePrice || "",
  });

  // Product-level images (array of {url, altText})
  const [images, setImages] = useState(
    initialData?.images?.length
      ? initialData.images
      : [{ url: "", altText: "" }],
  );

  // Variants
  const [variants, setVariants] = useState(
    initialData?.variants?.length
      ? initialData.variants.map((v) => ({
          ...v,
          _imageUrl: v.images?.[0]?.url || "",
        }))
      : [emptyVariant()],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Field setters ──────────────────────────────────────────────────────────
  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  // Images
  const setImage = (i, key, val) =>
    setImages((prev) =>
      prev.map((img, idx) => (idx === i ? { ...img, [key]: val } : img)),
    );
  const addImage = () => setImages((p) => [...p, { url: "", altText: "" }]);
  const removeImage = (i) => setImages((p) => p.filter((_, idx) => idx !== i));

  // Variants
  const setVariant = (i, key, val) =>
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [key]: val } : v)),
    );
  const addVariant = () => setVariants((p) => [...p, emptyVariant()]);
  const removeVariant = (i) =>
    setVariants((p) => p.filter((_, idx) => idx !== i));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!form.name.trim()) return setError("Product name is required.");
    if (!form.basePrice) return setError("Base price is required.");
    if (variants.some((v) => !v.sku.trim()))
      return setError("Every variant must have a SKU.");

    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      images: images
        .filter((img) => img.url.trim())
        .map(({ url, altText }) => ({ url, altText })),
      variants: variants.map(({ _imageUrl, ...v }) => ({
        ...v,
        stock: Number(v.stock) || 0,
        price: v.price ? Number(v.price) : undefined,
        images: _imageUrl ? [{ url: _imageUrl, altText: v.color || "" }] : [],
      })),
    };

    setLoading(true);
    try {
      if (isEdit) {
        const res = await api.patch(
          `/v1/seller/products/${productId}`,
          payload,
        );
        // console.log("EDIT response:", res);
        setSuccess(res.status === 200);
        setTimeout(() => navigate("/seller"), 1500);
      } else {
        const res = await api.post("/v1/seller/products", payload);
        //console.log("CREATE response:", res);
        setSuccess(res.status === 201);
        setTimeout(() => navigate("/seller"), 1500);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-foreground/10">
        <button
          onClick={() => navigate("/seller")}
          className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <Link to="/">
          <div className="w-9 h-9 rounded-full border-2 border-foreground flex items-center justify-center hover:opacity-70 transition-opacity">
            <Play className="w-3.5 h-3.5 fill-foreground" />
          </div>
        </Link>
        <div className="w-32" />
      </div>

      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
        <h1
          className="text-4xl font-black uppercase mb-1"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {isEdit ? "Edit Product" : "Add New Product"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {isEdit
            ? "Update your product details below."
            : "Fill in the details to list a new product."}
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm rounded-xl px-4 py-3 mb-6">
            <Check className="w-4 h-4 shrink-0" />
            {isEdit ? "Product updated!" : "Product listed successfully!"}{" "}
            Redirecting…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-0">
          {/* ── Basic Info ──────────────────────────────────────────────── */}
          <Section title="Basic Info">
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Product Name *</label>
                <input
                  placeholder="e.g. Classic White Tee"
                  value={form.name}
                  onChange={setField("name")}
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  placeholder="Describe the product, material, fit, etc."
                  value={form.description}
                  onChange={setField("description")}
                  rows={3}
                  className={INPUT + " resize-none"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Category</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={setField("category")}
                      className={INPUT + " appearance-none cursor-pointer"}
                    >
                      <option value="">Select…</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="kids">Kids</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Brand</label>
                  <input
                    placeholder="e.g. Zara, H&M"
                    value={form.brand}
                    onChange={setField("brand")}
                    className={INPUT}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ── Pricing ─────────────────────────────────────────────────── */}
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Base Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="999"
                  value={form.basePrice}
                  onChange={setField("basePrice")}
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Sale Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="799 (optional)"
                  value={form.salePrice}
                  onChange={setField("salePrice")}
                  className={INPUT}
                />
                {form.salePrice &&
                  form.basePrice &&
                  Number(form.salePrice) < Number(form.basePrice) && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {Math.round(
                        ((form.basePrice - form.salePrice) / form.basePrice) *
                          100,
                      )}
                      % discount
                    </p>
                  )}
              </div>
            </div>
          </Section>

          {/* ── Product Images ───────────────────────────────────────────── */}
          <Section title="Product Images">
            <p className="text-xs text-muted-foreground mb-4">
              Add image URLs for the product. The first image will be used as
              the thumbnail.
            </p>
            <div className="space-y-3">
              {images.map((img, i) => (
                <div key={i} className="flex gap-3 items-start">
                  {/* Preview */}
                  <div className="w-14 h-14 rounded-lg border border-foreground/10 bg-secondary/30 overflow-hidden shrink-0 flex items-center justify-center">
                    {img.url ? (
                      <img
                        src={img.url}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground opacity-40" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      placeholder="Image URL (https://...)"
                      value={img.url}
                      onChange={(e) => setImage(i, "url", e.target.value)}
                      className={INPUT}
                    />
                    <input
                      placeholder="Alt text (optional)"
                      value={img.altText}
                      onChange={(e) => setImage(i, "altText", e.target.value)}
                      className={INPUT + " py-2"}
                    />
                  </div>
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addImage}
              className="flex items-center gap-2 text-sm font-medium mt-4 hover:opacity-70 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add Image
            </button>
          </Section>

          {/* ── Variants ────────────────────────────────────────────────── */}
          <Section title="Variants">
            <p className="text-xs text-muted-foreground mb-4">
              Each variant is a unique size + color combo with its own SKU and
              stock count.
            </p>
            <div className="space-y-4">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="border border-foreground/10 rounded-xl p-4 relative"
                >
                  {/* Variant number */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Variant {i + 1}
                    </span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={LABEL}>SKU *</label>
                      <input
                        placeholder="e.g. WHT-TEE-M"
                        value={v.sku}
                        onChange={(e) => setVariant(i, "sku", e.target.value)}
                        className={INPUT}
                        required
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Color</label>
                      <input
                        placeholder="e.g. White"
                        value={v.color}
                        onChange={(e) => setVariant(i, "color", e.target.value)}
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Size</label>
                      <select
                        value={v.size}
                        onChange={(e) => setVariant(i, "size", e.target.value)}
                        className={INPUT + " appearance-none cursor-pointer"}
                      >
                        <option value="">Select…</option>
                        {["XS", "S", "M", "L", "XL", "2X", "One Size"].map(
                          (s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Stock</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={v.stock}
                        onChange={(e) => setVariant(i, "stock", e.target.value)}
                        className={INPUT}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={LABEL}>
                        Variant Price (₹){" "}
                        <span className="font-normal normal-case">
                          — overrides base price
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Leave blank to use base price"
                        value={v.price}
                        onChange={(e) => setVariant(i, "price", e.target.value)}
                        className={INPUT}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={LABEL}>Variant Image URL</label>
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg border border-foreground/10 bg-secondary/30 overflow-hidden shrink-0 flex items-center justify-center">
                          {v._imageUrl ? (
                            <img
                              src={v._imageUrl}
                              alt="variant"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-muted-foreground opacity-40" />
                          )}
                        </div>
                        <input
                          placeholder="https://..."
                          value={v._imageUrl}
                          onChange={(e) =>
                            setVariant(i, "_imageUrl", e.target.value)
                          }
                          className={INPUT}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-2 text-sm font-medium mt-4 border border-dashed border-foreground/30 rounded-xl px-4 py-3 w-full justify-center hover:bg-secondary/40 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </Section>

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/seller")}
              className="flex-1 border border-foreground/20 rounded-xl py-4 text-sm font-bold hover:bg-secondary/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 bg-foreground text-background rounded-xl py-4 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "List Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
