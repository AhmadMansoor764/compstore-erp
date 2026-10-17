import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

const Privacy = () => {
  const { t, isRTL } = useLanguage();

  const sections = [
    {
      title: "privacy.introduction",
      text: "privacy.introductionText",
    },
    {
      title: "privacy.information",
      text: "privacy.informationText",
    },
    {
      title: "privacy.usage",
      text: "privacy.usageText",
    },
    {
      title: "privacy.security",
      text: "privacy.securityText",
    },
    {
      title: "privacy.thirdParty",
      text: "privacy.thirdPartyText",
    },
    {
      title: "privacy.contact",
      text: "privacy.contactText",
    },
  ];

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-[#faf9ff] text-slate-950"
    >
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-[58px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.025em] text-blue-700"
          >
            <ShieldCheck size={24} />
            CompStore ERP
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-blue-700"
          >
            <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
            {t("contact.backHome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
        >
          <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            {t("privacy.title")}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {t("privacy.lastUpdated")}
          </p>

          <div className="mt-8 space-y-7 text-sm leading-7 text-slate-600">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-slate-950">
                  {t(section.title)}
                </h2>

                <p className="mt-2">{t(section.text)}</p>
              </section>
            ))}
          </div>

          <Link
            to="/contact"
            className="mt-8 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {t("privacy.contactSupport")}
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default Privacy;
