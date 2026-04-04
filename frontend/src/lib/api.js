// ─── Base ─────────────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = "http://localhost:5000/api"; // for testing

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const getAccessToken = () => localStorage.getItem("accessToken");
export const setAccessToken = (t) => localStorage.setItem("accessToken", t);
export const clearAccessToken = () => localStorage.removeItem("accessToken");

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(path, options = {}, retry = true) {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshToken();
    if (refreshed) return request(path, options, false);
    clearAccessToken();
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
    request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body) => api.post("/v1/register", body),
  login: (body) => api.post("/v1/login", body),
  logout: () => api.post("/v1/logout", {}),
  getMe: () => api.get("/v1/me"),
};

async function refreshToken() {
  try {
    const data = await fetch(`${BASE}/v1/user/refresh-token`, {
      method: "POST",
      credentials: "include",
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
  getById: (id) => api.get(`/v1/products/${id}`),
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
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== "" && v !== undefined && v !== null,
        ),
      ),
    ).toString();
    return api.get(`/v1/orders/seller${qs ? `?${qs}` : ""}`);
  },
  getOrderById: (orderId) => api.get(`/v1/orders/seller/${orderId}`),
  updateOrderStatus: (orderId, body) =>
    api.patch(`/v1/orders/seller/${orderId}/status`, body),

  // Insights
  getInsights: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== "" && v !== undefined && v !== null,
        ),
      ),
    ).toString();
    return api.get(`/v1/seller/insights${qs ? `?${qs}` : ""}`);
  },
};

// ─── Cart ──────────────────────────────────────────────────────────────────────
export const cartApi = {
  add: (productId, variantSku, quantity = 1) =>
    api.post("/v1/me/cart", { productId, variantSku, quantity }),
  remove: (itemId) => api.delete(`/v1/me/cart/${itemId}`),
  clear: () => api.delete("/v1/me/cart"),
};

// ─── Wishlist ──────────────────────────────────────────────────────────────────
export const wishlistApi = {
  toggle: (productId) => api.post("/v1/me/wishlist", { productId }),
};

// ─── Address ───────────────────────────────────────────────────────────────────
export const addressApi = {
  add: (body) => api.post("/v1/me/address", body),
  update: (addressId, body) => api.put(`/v1/me/address/${addressId}`, body),
  remove: (addressId) => api.delete(`/v1/me/address/${addressId}`),
};

// ─── Orders (Customer) ─────────────────────────────────────────────────────────
export const orderApi = {
  checkout: (body) => api.post("/v1/orders/checkout", body),
  getMyOrders: () => api.get("/v1/orders/my"),
  getById: (orderId) => api.get(`/v1/orders/my/${orderId}`),
  cancel: (orderId, reason) =>
    api.patch(`/v1/orders/my/${orderId}/cancel`, { reason }),
};
