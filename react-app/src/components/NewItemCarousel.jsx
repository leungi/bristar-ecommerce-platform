// src/components/NewItemCarousel.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/productsApi";

const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export default function NewItemsCarousel() {
  const scrollRef = useRef(null);
  const rafRef = useRef(0);
  const accRef = useRef(0);
  const { t, i18n } = useTranslation();

  const [baseNewItems, setBaseNewItems] = useState([]);
  const [paused, setPaused] = useState(false);
  const [snap, setSnap] = useState(false);
  const [speed, setSpeed] = useState(0.3);

  // 拉 New Items（语言变化也要重新拉）
  useEffect(() => {
    let cancelled = false;

    fetchProducts({ lang: i18n.language || "en", isNewItem: true })
      .then((list) => {
        if (!cancelled) setBaseNewItems(list);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setBaseNewItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  // 复制一份用于循环（没有数据时返回空数组，但不提前 return）
  const itemsForRender = useMemo(() => {
    if (!baseNewItems.length) return [];
    let arr = [...baseNewItems, ...baseNewItems];
    while (arr.length < 6) arr = [...arr, ...baseNewItems];
    return arr;
  }, [baseNewItems]);

  // 动态设定速度
  useEffect(() => {
    const mqs = {
      md: window.matchMedia?.("(min-width: 768px)"),
      lg: window.matchMedia?.("(min-width: 1024px)"),
      reduce: window.matchMedia?.("(prefers-reduced-motion: reduce)"),
    };

    const compute = () => {
      if (mqs.reduce?.matches) return 0.12;
      if (mqs.lg?.matches) return isIOS ? 0.35 : 0.18;
      if (mqs.md?.matches) return isIOS ? 0.45 : 0.22;
      return isIOS ? 0.7 : 0.3;
    };

    const apply = () => setSpeed(compute());

    apply();
    mqs.md?.addEventListener?.("change", apply);
    mqs.lg?.addEventListener?.("change", apply);
    mqs.reduce?.addEventListener?.("change", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      mqs.md?.removeEventListener?.("change", apply);
      mqs.lg?.removeEventListener?.("change", apply);
      mqs.reduce?.removeEventListener?.("change", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  // 自动滚动（如果没有 items，就不滚）
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const step = () => {
      if (!paused && itemsForRender.length) {
        accRef.current += speed;
        const dx = Math.floor(accRef.current);
        if (dx > 0) {
          el.scrollLeft += dx;
          accRef.current -= dx;
        }
        const half = Math.floor(el.scrollWidth / 2);
        if (half > 0 && el.scrollLeft >= half) {
          el.scrollLeft = 0;
          accRef.current = 0;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused, speed, itemsForRender.length]);

  // snap debounce
  const debounceOffSnap = (() => {
    let timer;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => setSnap(false), 250);
    };
  })();

  // 这里再决定渲染什么（不会影响 hooks 顺序）
  if (!itemsForRender.length) return null;

  return (
    <section className="relative px-4 md:px-6 mt-10 md:mt-16 bg-white">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 font-serif tracking-wide text-black">
        {t("newItem")}
      </h2>

      <div
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar"
        style={{
          width: "100%",
          maxWidth: "100vw",
          whiteSpace: "nowrap",
          position: "relative",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: snap ? "x mandatory" : "none",
        }}
        onMouseEnter={() => {
          setPaused(true);
          accRef.current = 0;
          setSnap(false);
        }}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => {
          setPaused(true);
          accRef.current = 0;
          setSnap(true);
        }}
        onTouchEnd={() => {
          setPaused(false);
          debounceOffSnap();
        }}
        onWheel={() => {
          setPaused(true);
          accRef.current = 0;
          setSnap(true);
          debounceOffSnap();
        }}
        onScroll={debounceOffSnap}
      >
        <div
          className="inline-flex gap-3 md:gap-5 px-2 py-3 md:py-4"
          style={{ width: "max-content" }}
        >
          {itemsForRender.map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              to={{
                pathname: "/products",
                search: `?category=${encodeURIComponent(
                  item.category,
                )}&highlight=${encodeURIComponent(item.id)}`,
              }}
              className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]"
              style={{ scrollSnapAlign: snap ? "center" : "none" }}
            >
              <div className="bg-base-100 rounded-box shadow hover:shadow-xl transition duration-300 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-32 sm:h-40 md:h-48 object-contain bg-gray-50"
                  loading={i < 6 ? "eager" : "lazy"}
                  decoding="async"
                  draggable="false"
                />
                <div className="p-1.5 sm:p-2 md:p-3 text-center text-[10px] sm:text-xs md:text-sm font-bold text-black">
                  {item.name}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
