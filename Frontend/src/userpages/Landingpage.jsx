import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  ArrowRight,
  Boxes,
  ChevronDown,
  Globe2,
  Menu,
  X,
  Eye,
  Zap,
  ShoppingCart,
  FileBarChart,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import dashboardPreview from "../assets/dashboard-preview.png";
import storeOwner from "../assets/store-owner.png";

import { useLanguage } from "../context/LanguageContext";

const Landingpage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const { language, changeLanguage, t, isRTL } = useLanguage();

  const languages = [
    { code: "en", label: "English", shortLabel: "EN" },
    { code: "fa", label: "دری", shortLabel: "دری" },
    { code: "ps", label: "پښتو", shortLabel: "پښتو" },
  ];

  const selectedLanguage =
    languages.find((item) => item.code === language) || languages[0];

  const features = [
    {
      icon: Boxes,
      title: t("landing.features.inventory.title"),
      description: t("landing.features.inventory.description"),
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700",
    },
    {
      icon: ShoppingCart,
      title: t("landing.features.sales.title"),
      description: t("landing.features.sales.description"),
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
    {
      icon: WalletCards,
      title: t("landing.features.expenses.title"),
      description: t("landing.features.expenses.description"),
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
    },
    {
      icon: FileBarChart,
      title: t("landing.features.reports.title"),
      description: t("landing.features.reports.description"),
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
    },
  ];

  const benefits = [
    {
      icon: Eye,
      title: t("landing.benefits.visibility.title"),
      description: t("landing.benefits.visibility.description"),
    },
    {
      icon: TrendingUp,
      title: t("landing.benefits.profit.title"),
      description: t("landing.benefits.profit.description"),
    },
    {
      icon: Zap,
      title: t("landing.benefits.automation.title"),
      description: t("landing.benefits.automation.description"),
    },
  ];

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setMobileMenuOpen(false);
  };

  const handleLanguageChange = (code) => {
    changeLanguage(code);
    setLanguageOpen(false);
  };

  const navItems = [
    { label: t("landing.nav.features"), id: "features" },
    { label: t("landing.nav.howItWorks"), id: "how-it-works" },
    { label: t("landing.nav.pricing"), id: "pricing" },
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#faf9ff] text-slate-950"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-[1400px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-10">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center justify-center"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                className="text-blue-700"
              >
                <path
                  d="M4 9.5V20H20V9.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 9.5L5 4H19L21 9.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 9.5C3 11.2 4.35 12.5 6 12.5C7.65 12.5 9 11.2 9 9.5C9 11.2 10.35 12.5 12 12.5C13.65 12.5 15 11.2 15 9.5C15 11.2 16.35 12.5 18 12.5C19.65 12.5 21 11.2 21 9.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>

            <span className="text-[18px] font-bold tracking-[-0.025em] text-blue-700 sm:text-[20px]">
              CompStore ERP
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="whitespace-nowrap text-[14px] font-medium text-slate-700 transition-colors hover:text-blue-700"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Language selector */}
            <div className="relative">
              <button
                type="button"
                aria-label={t("common.language")}
                aria-expanded={languageOpen}
                onClick={() => setLanguageOpen((previous) => !previous)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700"
              >
                <Globe2 size={16} />
                <span>{selectedLanguage.shortLabel}</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    languageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {languageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`absolute top-11 z-50 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ${
                      isRTL ? "left-0" : "right-0"
                    }`}
                  >
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleLanguageChange(item.code)}
                        className={`block w-full rounded-lg px-3 py-2.5 text-start text-[13px] transition-colors ${
                          language === item.code
                            ? "bg-blue-50 font-semibold text-blue-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="h-5 w-px bg-slate-300" />

            <Link
              to="/login"
              className="whitespace-nowrap rounded-md border border-slate-400 px-4 py-2 text-[13px] font-semibold text-slate-800 transition-all hover:border-blue-600 hover:text-blue-700"
            >
              {t("common.login")}
            </Link>

            <Link
              to="/signup"
              className="whitespace-nowrap rounded-md bg-blue-700 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-blue-800 hover:shadow-md"
            >
              {t("common.signup")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? t("common.close") : t("common.menu")}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-200 bg-white px-5 py-5 md:hidden"
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="text-start text-[15px] font-medium text-slate-700 transition-colors hover:text-blue-700"
                  >
                    {item.label}
                  </button>
                ))}

                {/* Mobile language selector */}
                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Globe2 size={16} />
                    {t("common.language")}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleLanguageChange(item.code)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          language === item.code
                            ? "border-blue-700 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 border-t border-slate-200 pt-4">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-md border border-slate-300 py-2.5 text-center text-[14px] font-semibold text-slate-800"
                  >
                    {t("common.login")}
                  </Link>

                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-md bg-blue-700 py-2.5 text-center text-[14px] font-semibold text-white"
                  >
                    {t("common.signup")}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO */}
      <section className="relative scroll-mt-20 overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-24 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-24">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-100/25 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#94a3b8_0.6px,transparent_0.6px)] [background-size:22px_22px]" />
        </div>

        <div className="relative mx-auto max-w-[900px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mx-auto max-w-[800px] text-[36px] font-bold leading-[1.2] tracking-[-0.035em] text-slate-950 sm:text-[46px] lg:text-[52px]">
              {t("landing.hero.title")}
            </h1>

            <p className="mx-auto mt-6 max-w-[700px] text-[16px] leading-7 text-slate-600 sm:text-[17px]">
              {t("landing.hero.description")}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex h-[48px] min-w-[150px] items-center justify-center gap-2 rounded-md bg-blue-700 px-6 text-[14px] font-semibold text-white shadow-md shadow-blue-700/15 transition-colors hover:bg-blue-800"
                >
                  {t("landing.hero.getStarted")}
                  <ArrowRight size={17} className={isRTL ? "rotate-180" : ""} />
                </motion.div>
              </Link>

              <button
                type="button"
                onClick={() => scrollToSection("dashboard-preview")}
                className="flex h-[48px] min-w-[150px] items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 text-[14px] font-medium text-slate-800 transition-all hover:border-blue-500 hover:text-blue-700"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-700">
                  <span className="text-[9px]">▶</span>
                </span>
                {t("landing.hero.viewDemo")}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Dashboard preview */}
        <motion.div
          id="dashboard-preview"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto mt-14 max-w-[1000px] scroll-mt-24 sm:mt-16"
        >
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-white p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:rounded-2xl sm:p-2">
            <img
              src={dashboardPreview}
              alt={t("landing.images.dashboardAlt")}
              className="block h-auto w-full rounded-lg object-cover"
            />
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="scroll-mt-20 bg-[#f1f2ff] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-24"
      >
        <div className="mx-auto max-w-[1100px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-[30px] font-bold tracking-[-0.025em] text-slate-950 sm:text-[38px]">
              {t("landing.features.heading")}
            </h2>

            <p className="mt-4 text-[15px] leading-7 text-slate-600 sm:text-[16px]">
              {t("landing.features.subtitle")}
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-md ${feature.iconBg}`}
                  >
                    <Icon size={20} className={feature.iconColor} />
                  </div>

                  <h3 className="mt-5 text-[17px] font-semibold text-slate-950 sm:text-[18px]">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-[14px] leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / BENEFITS */}
      <section
        id="how-it-works"
        className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-24"
      >
        <div className="mx-auto grid max-w-[1100px] items-center gap-12 lg:grid-cols-2 lg:gap-14">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 35 : -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
              <img
                src={storeOwner}
                alt={t("landing.images.storeOwnerAlt")}
                className="h-auto w-full object-cover"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -35 : 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-[30px] font-bold tracking-[-0.025em] text-slate-950 sm:text-[38px]">
              {t("landing.benefits.heading")}
            </h2>

            <div className="mt-8 space-y-6">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                      <Icon
                        size={20}
                        strokeWidth={2}
                        className="text-blue-700"
                      />
                    </div>

                    <div>
                      <h3 className="text-[17px] font-semibold text-slate-950">
                        {benefit.title}
                      </h3>

                      <p className="mt-1.5 max-w-[500px] text-[14px] leading-6 text-slate-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="scroll-mt-20 bg-[#f1f2ff] px-5 py-20 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-[30px] font-bold tracking-[-0.025em] sm:text-[36px]">
            {t("landing.pricing.heading")}
          </h2>

          <p className="mt-4 text-[15px] leading-7 text-slate-600 sm:text-[16px]">
            {t("landing.pricing.description")}
          </p>

          <motion.div
            whileHover={{ y: -4 }}
            className="mx-auto mt-8 max-w-[390px] rounded-xl border border-slate-300 bg-white p-7 shadow-sm"
          >
            <p className="text-[15px] font-semibold text-blue-700">
              CompStore ERP
            </p>

            <h3 className="mt-3 text-3xl font-bold">
              {t("landing.pricing.comingSoon")}
            </h3>

            <p className="mt-3 text-[14px] leading-6 text-slate-600">
              {t("landing.pricing.planDescription")}
            </p>

            <Link
              to="/signup"
              className="mt-6 flex h-12 items-center justify-center rounded-md bg-blue-700 text-[14px] font-semibold text-white transition-colors hover:bg-blue-800"
            >
              {t("landing.hero.getStarted")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-300 bg-[#e5e6f1]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[15px] font-bold text-slate-950">
              CompStore ERP
            </span>

            <span className="hidden text-slate-400 sm:inline">|</span>

            <span className="text-[13px] text-slate-600">
              {t("landing.footer.copyright")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-slate-700">
            <Link
              to="/privacy"
              className="transition-colors hover:text-blue-700"
            >
              {t("landing.footer.privacy")}
            </Link>

            <Link to="/terms" className="transition-colors hover:text-blue-700">
              {t("landing.footer.terms")}
            </Link>

            <Link
              to="/contact"
              className="transition-colors hover:text-blue-700"
            >
              {t("landing.footer.contact")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landingpage;
