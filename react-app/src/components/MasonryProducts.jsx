// src/components/MasonryProducts.jsx
import { useMemo, useState, useEffect } from "react";
import { Join, Button, Input } from "react-daisyui";
import { useTranslation } from "react-i18next";

export default function MasonryProducts({
  products,
  category,
  page,
  setPage,
  highlightId,
  setSearchParams,
  onOpenCategories,
}) {
  const { t } = useTranslation();
  const perPage = 6;

  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");

  /* ---------- filtering ---------- */
  const filteredSorted = useMemo(() => {
    const normalize = (str) =>
      (str || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\p{L}\p{N}]/gu, "");

    const q = normalize(searchTerm);

    const normalizedCat = String(category || "")
      .toLowerCase()
      .trim();
    const isVirtualNew = category === "__new__";

    let filtered = [];

    if (q) {
      // 搜索：基于 name + desc（后端已按语言合并）
      const map = new Map();
      for (const p of products) {
        if (normalize(p.name).includes(q) || normalize(p.desc).includes(q)) {
          if (!map.has(p.id)) map.set(p.id, p);
        }
      }
      filtered = Array.from(map.values());
    } else {
      if (category === "__all__") {
        const seen = new Set();
        filtered = products.filter((p) => !seen.has(p.id) && seen.add(p.id));
      } else if (isVirtualNew) {
        const seen = new Set();
        filtered = products.filter(
          (p) => p.isNewItem && !seen.has(p.id) && seen.add(p.id),
        );
      } else {
        filtered = products.filter(
          (p) =>
            p.category?.toLowerCase().trim() ===
            String(category || "")
              .toLowerCase()
              .trim(),
        );
      }
    }

    // 排序
    filtered.sort((a, b) =>
      sortOrder === "asc"
        ? (a.name || "").localeCompare(b.name || "")
        : (b.name || "").localeCompare(a.name || ""),
    );

    // 高亮项提前
    if (!q && highlightId) {
      const idx = filtered.findIndex((p) => p.id === highlightId);
      if (idx > 0) {
        const [hit] = filtered.splice(idx, 1);
        filtered.unshift(hit);
      }
    }

    return filtered;
  }, [products, category, searchTerm, sortOrder, highlightId]);

  const totalPages = Math.ceil(filteredSorted.length / perPage);
  const slice = filteredSorted.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (highlightId) setPage(1);
  }, [highlightId, setPage]);

  useEffect(() => {
    setSearchTerm("");
    setPage(1);
  }, [category, setPage]);

  /* ---------- responsive pagination ---------- */
  const [maxItems, setMaxItems] = useState(5);
  useEffect(() => {
    const mqMd = window.matchMedia("(min-width:768px)");
    const mqLg = window.matchMedia("(min-width:1024px)");
    const update = () => setMaxItems(mqLg.matches ? 9 : mqMd.matches ? 7 : 5);
    update();
    mqMd.addEventListener?.("change", update);
    mqLg.addEventListener?.("change", update);
    return () => {
      mqMd.removeEventListener?.("change", update);
      mqLg.removeEventListener?.("change", update);
    };
  }, []);

  const pageItems = useMemo(() => {
    if (totalPages <= maxItems)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const windowSize = maxItems - 4; // 1 + … + window + … + last
    let start = Math.max(2, page - Math.floor(windowSize / 2));
    let end = Math.min(totalPages - 1, start + windowSize - 1);
    start = Math.max(2, Math.min(start, totalPages - windowSize));

    const items = [1];
    if (start > 2) items.push("…");
    for (let i = start; i <= end; i++) items.push(i);
    if (end < totalPages - 1) items.push("…");
    items.push(totalPages);
    return items;
  }, [page, totalPages, maxItems]);

  const normalizedCat = String(category || "")
    .toLowerCase()
    .trim();
  const isVirtualNew = normalizedCat.includes("new item");

  return (
    <>
      {/* Search + Sort + Mobile Categories */}
      <div
        className="grid items-center gap-2 mt-1 mb-3 md:mb-6
        grid-cols-[minmax(9rem,3fr)_minmax(4.8rem,1fr)_minmax(6.4rem,2fr)]
        md:grid-cols-[minmax(16rem,1fr)_auto]"
      >
        <Input
          type="text"
          placeholder={`🔍 ${t("searchProduct")}...`}
          className="input input-bordered input-sm text-base"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value.trimStart());
            setPage(1);
          }}
        />
        <select
          className="select select-bordered select-sm text-base"
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setPage(1);
          }}
        >
          <option value="asc">A–Z</option>
          <option value="desc">Z–A</option>
        </select>
        <button
          className="btn btn-outline btn-sm md:hidden"
          onClick={onOpenCategories}
        >
          {t("categories")}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {slice.map((p) => (
          <button
            key={p.slug || p.id}
            onClick={() => {
              // 如果当前在 New Items 页面，保持 category 不变，只更新 highlight
              const catForUrl = isVirtualNew ? category : p.category;
              setSearchParams({ category: catForUrl, highlight: p.id });

              setSearchTerm("");
              setPage(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`card h-full shadow hover:shadow-lg transition ${
              p.id === highlightId ? "border-2 border-black" : ""
            }`}
          >
            <figure className="bg-gray-50">
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-full h-40 md:h-56 object-contain"
                loading="lazy"
              />
            </figure>
            <div className="card-body p-3">
              <h3 className="card-title text-sm md:text-xl text-black line-clamp-2">
                {p.name}
              </h3>
              <p className="card-title ext-sm text-black line-clamp-2">
                {p.desc}
              </p>
              <p className="text-[11px] text-black mt-auto">{p.code}</p>
            </div>
          </button>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="col-span-2 lg:col-span-3 flex justify-center">
            <Join>
              <Button disabled={page === 1} onClick={() => setPage(1)}>
                «
              </Button>
              <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                ‹
              </Button>

              {pageItems.map((it, i) =>
                it === "…" ? (
                  <Button key={`dots-${i}`} disabled>
                    …
                  </Button>
                ) : (
                  <Button
                    key={`page-${it}`}
                    className={page === it ? "btn-active" : ""}
                    onClick={() => setPage(it)}
                  >
                    {it}
                  </Button>
                ),
              )}

              <Button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                ›
              </Button>
              <Button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </Button>
            </Join>
          </div>
        )}
      </div>
    </>
  );
}
