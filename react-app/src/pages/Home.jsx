import { Link } from "react-router-dom";
import NewItemsCarousel from "../components/NewItemCarousel";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-24 bg-white ">
        <h1 className="text-5xl md:text-6xl font-bold tracking-wide text-black">
          BRISTAR INTL TRADING LTD.
        </h1>

        <p className="text-3xl mt-4 text-black tracking-[1.5em]">
          永輝國際貿易
        </p>
        <hr className="border-t-4 border-red-600 w-36 mx-auto my-6 " />
        <p className="max-w-xl mx-auto text-base text-black">
          Asian Food Importer & Distributor in Vancouver
        </p>
      </section>

      {/* About Section */}
      <section className="max-w-4xl mx-auto px-6 text-center text-black">
        <h2 className="text-2xl font-semibold mb-4">{t("ourCompany")}</h2>
        <p className="leading-relaxed text-lg text-black">
          {t("ourCompanyInfo")}
        </p>
      </section>

      {/* New Item Grid */}
      <NewItemsCarousel />

      {/* Contact CTA */}
      <section className="text-center py-20 px-6">
        <h2 className="text-2xl font-semibold mb-4">{t("contactTitle")}</h2>
        <p className="text-gray-600 mb-6">{t("homeContactInfo")}</p>
        <Link to="/contact" className="btn btn-outline btn-wide">
          {t("homeContact")}
        </Link>
      </section>
    </div>
  );
}
