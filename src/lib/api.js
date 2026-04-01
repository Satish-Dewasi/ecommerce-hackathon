// ─── Base ─────────────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const getAccessToken = () => localStorage.getItem("accessToken");
export const setAccessToken = (t) => localStorage.setItem("accessToken", t);
export const clearAccessToken = () => localStorage.removeItem("accessToken");

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
/**
 * Makes an authenticated (or public) request.
 * Automatically refreshes the access token on 401 and retries once.
 */
async function request(path, options = {}, retry = true) {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: "include" });

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
  get:    (path, opts)  => request(path, { method: "GET",    ...opts }),
  post:   (path, body)  => request(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: "DELETE" }),
};

// ─── Auth ──────────────────────────────────────────────────────────────────────
// Backend mounts userRoutes at /api/v1/user → full paths: /v1/user/register etc.
export const authApi = {
  register: (body)  => api.post("/v1/user/register", body),
  login:    (body)  => api.post("/v1/user/login",    body),
  logout:   ()      => api.post("/v1/user/logout",   {}),
  getMe:    ()      => api.get("/v1/user/me"),
};

async function refreshToken() {
  try {
    const data = await fetch(`${BASE}/v1/user/refresh-token`, {
      method: "POST",
      credentials: "include",   // ← cookie must travel with this request
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
// Mounted at /api/v1 (no /user prefix) → /v1/products, /v1/products/:id
export const productApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null))
    ).toString();
    return api.get(`/v1/products${qs ? `?${qs}` : ""}`);
  },
  // Server returns data as array — always read data[0] on the frontend
  getById: (id) => api.get(`/v1/products/${id}`),
  // Category route fixed in productRoutes.js → /products/category/:cat
  getByCategory: (category) => api.get(`/v1/products/category/${category}`),
};

// ─── Cart ──────────────────────────────────────────────────────────────────────
export const cartApi = {
  add:    (productId, variantSku, quantity = 1) =>
            api.post("/v1/user/me/cart", { productId, variantSku, quantity }),
  remove: (itemId) => api.delete(`/v1/user/me/cart/${itemId}`),
  clear:  ()       => api.delete("/v1/user/me/cart"),
};

// ─── Wishlist ──────────────────────────────────────────────────────────────────
export const wishlistApi = {
  // Toggle: adds if not present, removes if already in wishlist
  toggle: (productId) => api.post("/v1/user/me/wishlist", { productId }),
};

// ─── Address ───────────────────────────────────────────────────────────────────
export const addressApi = {
  add:    (body)            => api.post("/v1/user/me/address",              body),
  update: (addressId, body) => api.put(`/v1/user/me/address/${addressId}`, body),
  remove: (addressId)       => api.delete(`/v1/user/me/address/${addressId}`),
};