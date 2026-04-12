// const BASE = import.meta.env.VITE_API_BASE_URL;
const BASE = "http://localhost:5000/api";

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const getAccessToken = () => localStorage.getItem("accessToken");
export const setAccessToken = (t) => localStorage.setItem("accessToken", t);
export const clearAccessToken = () => localStorage.removeItem("accessToken");

async function request(path, options = {}, retry = true) {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Token expired → try refresh, then retry
  if (res.status === 401 && retry) {
    const refreshed = await refreshToken();
    if (refreshed) return request(path, options, false);
    clearAccessToken();
    // Dispatch a custom event so AuthContext can react
    window.dispatchEvent(new Event("auth:logout"));
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }

  return data;
}

// ─── Convenience methods ───────────────────────────────────────────────────────
export const api = {
  get: (path, opts) => request(path, { method: "GET", ...opts }),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) =>
    request(path, { method: "PATCH", body: JSON.stringify(body) }), // ← add this
  delete: (path) => request(path, { method: "DELETE" }),
};

export const authApi = {
  register: (body) => api.post("/v1/register", body),
  login: (body) => api.post("/v1/login", body),
  logout: () => api.post("/v1/logout", {}),
  getMe: () => api.get("/v1/me"),
  updateProfile: (body) => api.put("/v1/me/update", body),
  updateUserRole: (userId, role) =>
    api.put(`/v1/admin/users/${userId}/role`, { role }),
};

async function refreshToken() {
  try {
    const data = await fetch(`${BASE}/v1/user/refresh-token`, {
      method: "POST",
      credentials: "include", // ← cookie must travel with this request
    }).then((r) => r.json());

    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Products ──────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== "" && v !== undefined && v !== null,
        ),
      ),
    ).toString();
    return api.get(`/v1/products${qs ? `?${qs}` : ""}`);
  },
  // Server returns data as array — always read data[0] on the frontend
  getById: (id) => api.get(`/v1/products/${id}`),
  // Category route fixed in productRoutes.js → /products/category/:cat
  getByCategory: (category) => api.get(`/v1/products/category/${category}`),
};

// ─── Seller ────────────────────────────────────────────────────────────────────
export const sellerApi = {
  // Products
  getMyProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== "" && v !== undefined && v !== null,
        ),
      ),
    ).toString();
    return api.get(`/v1/seller/products${qs ? `?${qs}` : ""}`);
  },
  getProductById: (id) => api.get(`/v1/seller/products/${id}`),
  createProduct: (body) => api.post("/v1/seller/products", body),
  updateProduct: (id, body) => api.patch(`/v1/seller/products/${id}`, body),
  deleteProduct: (id) => api.delete(`/v1/seller/products/${id}`),

  // Variants
  addVariant: (productId, body) =>
    api.post(`/v1/seller/products/${productId}/variants`, body),
  updateVariant: (productId, sku, body) =>
    api.patch(`/v1/seller/products/${productId}/variants/${sku}`, body),
  deleteVariant: (productId, sku) =>
    api.delete(`/v1/seller/products/${productId}/variants/${sku}`),

  // Orders
  getMyOrders: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== "" && v !== undefined && v !== null,
        ),
      ),
    ).toString();
    return api.get(`/v1/orders/seller${qs ? `?${qs}` : ""}`);
  },
  getMyOrderById: (orderId) => api.get(`/v1/orders/seller/${orderId}`),
  updateOrderStatus: (orderId, body) =>
    api.patch(`/v1/orders/seller/${orderId}/status`, body),

  getSalesInsights: () => api.get("/v1/seller/insights"),
};

// ─── Cart ──────────────────────────────────────────────────────────────────────
export const cartApi = {
  add: (productId, variantSku, quantity = 1) =>
    api.post("/v1/me/cart", { productId, variantSku, quantity }),
  remove: (itemId) => api.delete(`/v1/me/cart/${itemId}`),
  clear: () => api.delete("/v1/me/cart"),
};

// ─── Orders ────────────────────────────────────────────────────────────────────
export const orderApi = {
  // Place a new order (checkout)
  checkout: (body) => api.post("/v1/orders/checkout", body),

  // Get all orders of the logged-in customer
  getAll: () => api.get("/v1/orders/my"),

  // Get a single order by ID
  getById: (orderId) => api.get(`/v1/orders/${orderId}`),
};

// ─── Wishlist ──────────────────────────────────────────────────────────────────
export const wishlistApi = {
  // Toggle: adds if not present, removes if already in wishlist
  toggle: (productId) => api.post("/v1/me/wishlist", { productId }),
};

// ─── Address ───────────────────────────────────────────────────────────────────
export const addressApi = {
  add: (body) => api.post("/v1/me/address", body),
  update: (addressId, body) => api.put(`/v1/me/address/${addressId}`, body),
  remove: (addressId) => api.delete(`/v1/me/address/${addressId}`),
};

export const paymentApi = {
  createOrder: (body) => api.post("/v1/payment/create-order", body),
  verify: (body) => api.post("/v1/payment/verify", body),
};
