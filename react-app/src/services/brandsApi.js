const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getBrands() {
  const res = await fetch(`${API_BASE}/api/brands`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.brands || [];
}
