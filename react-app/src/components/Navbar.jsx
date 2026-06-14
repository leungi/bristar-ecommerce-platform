import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const Menu = (
    <ul className="menu p-2 lg:menu-horizontal lg:px-1 gap-1 text-base lg:text-xl lg:font-bold">
      <li>
        <Link to="/" onClick={() => setOpen(false)}>
          {t("home")}
        </Link>
      </li>
      <li tabIndex={0}>
        <details>
          <summary>{t("products")}</summary>
          <ul className="p-2 bg-base-100 z-[1]  w-56">
            <li>
              <Link
                to="/products?category=__new__"
                onClick={() => setOpen(false)}
              >
                {t("newItems")}
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=Beverage"
                onClick={() => setOpen(false)}
              >
                {t("beverage")}
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=Canned and Dried"
                onClick={() => setOpen(false)}
              >
                {t("canned and dried")}
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=Grains and Beans"
                onClick={() => setOpen(false)}
              >
                {t("grains and beans")}
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=Houseware"
                onClick={() => setOpen(false)}
              >
                {t("houseware")}
              </Link>
            </li>
            <li>
              <Link to="/products?category=Joss" onClick={() => setOpen(false)}>
                {t("joss")}
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=Noodle"
                onClick={() => setOpen(false)}
              >
                {t("noodle")}
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=Sauce and Paste"
                onClick={() => setOpen(false)}
              >
                {t("sauce and paste")}
              </Link>
            </li>

            <li>
              <Link
                to="/products?category=Seasoning and Spice"
                onClick={() => setOpen(false)}
              >
                {t("seasoning and spice")}
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=Snack"
                onClick={() => setOpen(false)}
              >
                {t("snack")}
              </Link>
            </li>
            <li>
              <Link to="/products?category=Tea" onClick={() => setOpen(false)}>
                {t("tea")}
              </Link>
            </li>
          </ul>
        </details>
      </li>
      <li>
        <Link to="/brands" onClick={() => setOpen(false)}>
          {t("brand")}
        </Link>
      </li>
      <li>
        <Link to="/contact" onClick={() => setOpen(false)}>
          {t("contact")}
        </Link>
      </li>
      <li>
        <button
          className="btn btn-sm btn-outline"
          onClick={() =>
            i18n.changeLanguage(i18n.language === "en" ? "zh" : "en")
          }
        >
          🌐 {i18n.language === "en" ? "中文" : "EN"}
        </button>
      </li>
    </ul>
  );

  return (
    <div className="navbar bg-base-100 shadow-sm px-4 lg:px-6 dark:bg-gray-900">
      {/* 左侧：Logo + Hamburger */}
      <div className="flex-1">
        <button
          className="lg:hidden btn btn-ghost btn-square text-lg mr-2 "
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <Link to="/" className="font-bold tracking-wide">
          <img
            src="/assets/icon.png"
            alt="Logo"
            className="h-12 w-auto lg:h-20"
          />
        </Link>
      </div>

      {/* 右侧：桌面菜单 */}
      <div className="flex-none hidden lg:block">{Menu}</div>

      {/* 抽屉：移动端菜单 */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-4/5 max-w-xs bg-base-100 shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">{t("products")}</span>
              <button
                className="btn btn-ghost btn-sm text-lg"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            {Menu}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
