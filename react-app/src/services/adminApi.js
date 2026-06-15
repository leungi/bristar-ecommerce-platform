const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // cookie
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const adminAuth = {
  login: (email, password) =>
    request("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request("/api/admin/auth/me"),
  logout: () => request("/api/admin/auth/logout", { method: "POST" }),
};

export const adminProducts = {
  list: (q = "") =>
    request(`/api/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  create: (product) =>
    request("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  update: (slug, patch) =>
    request(`/api/admin/products/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
  remove: (slug) =>
    request(`/api/admin/products/${encodeURIComponent(slug)}`, {
      method: "DELETE",
    }),
};

export const adminBrands = {
  list: () => request("/api/admin/brands"),

  create: (data) =>
    request("/api/admin/brands", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/api/admin/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id) =>
    request(`/api/admin/brands/${id}`, {
      method: "DELETE",
    }),
};

export const adminS3 = {
  presignPut: (filename, contentType, folder = "products") =>
    request("/api/admin/s3/presign-put", {
      method: "POST",
      body: JSON.stringify({
        filename,
        contentType,
        folder,
      }),
    }),
  deleteObject: (key) =>
    request("/api/admin/s3/delete", {
      method: "POST",
      body: JSON.stringify({ key }),
    }),
};

export const adminUsers = {
  list: () => request("/api/admin/users"),
  create: (payload) =>
    request("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/api/admin/users/${id}`, {
      method: "DELETE",
    }),
};

export const productsApi = {
  categories: () => request("/api/products/categories"),
};
