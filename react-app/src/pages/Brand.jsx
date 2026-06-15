import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Brand() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("zh") ? "zh" : "en";

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrands() {
      try {
        const res = await fetch(`${API_BASE}/api/brands`);
        const data = await res.json();
        setBrands(data.brands || []);
      } catch (err) {
        console.error("Failed to load brands:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBrands();
  }, []);

  const mainBrand = brands.find((brand) => brand.isMainBrand);
  const otherBrands = brands.filter((brand) => !brand.isMainBrand);

  const getName = (brand) => {
    return brand.name?.[lang] || brand.name?.en || brand.name?.zh || "";
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">Loading brands...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-4xl font-bold text-center mb-10">
        Our brand and partner
      </h1>

      {mainBrand && (
        <section className="mb-14 text-center">
          <img
            src={mainBrand.imageUrl}
            alt={getName(mainBrand)}
            className="mx-auto max-h-72 max-w-xl object-contain"
          />

          {/* {getName(mainBrand) && (
            <h2 className="mt-6 text-2xl font-semibold">
              {getName(mainBrand)}
            </h2>
          )} */}
        </section>
      )}

      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-12 gap-y-12">
          {otherBrands.map((brand) => (
            <div key={brand._id} className="text-center">
              <img
                src={brand.imageUrl}
                alt={getName(brand)}
                className="mx-auto h-28 max-w-full object-contain"
              />

              {/* {getName(brand) && (
                <h3 className="mt-4 font-medium text-gray-800">
                  {getName(brand)}
                </h3>
              )} */}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
