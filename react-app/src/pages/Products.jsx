// src/pages/Products.jsx
import { useState, useEffect, useMemo } from "react";
import MasonryProducts from "../components/MasonryProducts";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCategories, fetchProducts } from "../services/productsApi";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

  const categoryFromURL = searchParams.get("category") || "__all__";
  const highlightId = searchParams.get("highlight");

  const [category, setCategory] = useState(categoryFromURL);
  const [page, setPage] = useState(1);

  // 抽屉开关
  const [catOpen, setCatOpen] = useState(false);

  // 从后端拉回来的分类 & 产品
  const [categories, setCategories] = useState([]); // e.g. ["Beverage", "Canned and Dried", ...]
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL category 变化时同步 state
  useEffect(() => {
    setCategory(categoryFromURL);
    setPage(1);
  }, [categoryFromURL]);

  // 关键：补上 allCategories（All + New Items + 后端分类）
  const allCategories = useMemo(() => {
    return ["__all__", "__new__", ...categories];
  }, [categories]);

  // 1) 拉分类（一次即可）
  useEffect(() => {
    let cancelled = false;

    fetchCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  // 2) 拉产品：语言或分类变化都要重新拉
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const currentLang = i18n.language || "en";

    const isVirtualNew = category === "__new__";

    const params = { lang: currentLang };

    if (isVirtualNew) {
      // New Items 是虚拟分类：用 isNewItem 过滤，不传 category
      params.isNewItem = true;
    } else if (category !== "__all__") {
      // 真实分类：传 category
      params.category = category;
    }

    fetchProducts(params)
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [i18n.language, category]);

  const getCategoryLabel = (cat) => {
    if (cat === "__all__") return t("all");
    if (cat === "__new__") return t("newItems");
    return t(String(cat).toLowerCase());
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 text-base lg:text-lg">
      {/* Mobile：底部抽屉 */}
      <MobileCategoryBar
        category={category}
        allCategories={allCategories}
        setSearchParams={setSearchParams}
        setPage={setPage}
        t={t}
        open={catOpen}
        setOpen={setCatOpen}
        hideTrigger
        getCategoryLabel={getCategoryLabel}
      />

      {/* Desktop: 左侧侧栏 */}
      <aside className="hidden lg:block sticky top-24 max-h-[75vh] overflow-auto bg-base-100 rounded-box shadow-xl p-4 w-60">
        <ul className="menu menu-vertical gap-2 text-xl">
          {allCategories.map((cat) => (
            <button
              key={`cat-${cat}`}
              onClick={() => setSearchParams({ category: cat })}
              className="w-full text-left px-4 py-2 group"
            >
              <span
                className={`relative inline-block transition-all duration-300
                  ${category === cat ? "text-black" : "text-black"}
                  group-hover:text-black font-bold
                  after:absolute after:bottom-0 after:left-0 after:h-[2px]
                  after:bg-black after:w-full after:transition-transform after:duration-300 
                  after:origin-left
                  ${category === cat ? "after:scale-x-100" : "after:scale-x-0"}
                  group-hover:after:scale-x-100`}
              >
                {getCategoryLabel(cat)}
              </span>
            </button>
          ))}
        </ul>
      </aside>

      <main className="flex-1">
        {loading ? (
          <div className="p-4 text-gray-500">
            {t("loading") || "Loading..."}
          </div>
        ) : (
          <MasonryProducts
            category={category}
            products={products}
            page={page}
            setPage={setPage}
            highlightId={highlightId}
            setSearchParams={setSearchParams}
            onOpenCategories={() => setCatOpen(true)}
          />
        )}
      </main>
    </div>
  );
}

/* ============ Mobile Category Bar + Bottom Sheet ============ */
function MobileCategoryBar({
  category,
  allCategories,
  setSearchParams,
  setPage,
  t,
  open,
  setOpen,
  hideTrigger = false,
  getCategoryLabel = { getCategoryLabel },
}) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = original);
  }, [open]);

  const label = (cat) => getCategoryLabel(cat);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label={t("categories") || "Categories"}
            className="absolute left-0 right-0 bottom-0 rounded-t-2xl bg-base-100 shadow-2xl p-4 pb-6 max-h-[75vh] overflow-y-auto"
          >
            <div className="mx-auto h-1.5 w-10 bg-gray-300 rounded-full mb-3" />
            <h3 className="text-center font-semibold mb-3 text-base sm:text-lg">
              {t("categories") || "Categories"}
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {allCategories.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={`mcat-${cat}`}
                    onClick={() => {
                      setSearchParams({ category: cat });
                      setPage(1);
                      setOpen(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`btn whitespace-nowrap normal-case
                      btn-sm sm:btn-md
                      text-[12px] sm:text-sm
                      ${active ? "btn-neutral" : "btn-outline"}`}
                  >
                    {label(cat)}
                  </button>
                );
              })}
            </div>

            <button
              className="btn btn-block btn-ghost mt-4 text-sm"
              onClick={() => setOpen(false)}
            >
              {t("close") || "Close"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
