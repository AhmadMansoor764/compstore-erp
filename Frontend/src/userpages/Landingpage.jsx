import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

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

// Replace these two imports with your actual images later
import dashboardPreview from "../assets/dashboard-preview.png";
import storeOwner from "../assets/store-owner.png";

const Landingpage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("EN");

  const languages = ["EN", "Dari", "Pashto"];

  const features = [
    {
      icon: Boxes,
      title: "Inventory Tracking",
      description:
        "Real-time stock management with low-stock alerts and serial number tracking for high-value items.",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700",
    },
    {
      icon: ShoppingCart,
      title: "Sales & POS",
      description:
        "Process transactions quickly, manage returns, and generate professional invoices in seconds.",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
    {
      icon: WalletCards,
      title: "Expense Management",
      description:
        "Track operational costs, vendor payments, and staff salaries to understand your true margins.",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
    },
    {
      icon: FileBarChart,
      title: "Advanced Reports",
      description:
        "Comprehensive profit & loss statements, sales trends, and tax-ready financial exports.",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
    },
  ];

  const benefits = [
    {
      icon: Eye,
      title: "Total Visibility",
      description:
        "Know exactly what's in your warehouse and what's on the shelf at any given moment.",
    },
    {
      icon: TrendingUp,
      title: "Profit Tracking",
      description:
        "Automated margin calculations ensure you're pricing competitively while maintaining profitability.",
    },
    {
      icon: Zap,
      title: "Reduced Manual Work",
      description:
        "Stop fighting with spreadsheets. Automate routine data entry and focus on growing your business.",
    },
  ];

  // Smooth scroll
  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf9ff] text-slate-950">
      {/* =========================================================
          NAVBAR
      ========================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Logo */}

          <Link to="/" className="flex items-center gap-2.5">
            <motion.div
              whileHover={{
                scale: 1.05,
              }}
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

            <span className="text-[19px] font-bold tracking-[-0.025em] text-blue-700 sm:text-[20px]">
              CompStore ERP
            </span>
          </Link>

          {/* Desktop navigation */}

          <nav className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollToSection("features")}
              className="text-[14px] font-medium text-slate-700 transition-colors hover:text-blue-700"
            >
              Features
            </button>

            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-[14px] font-medium text-slate-700 transition-colors hover:text-blue-700"
            >
              How It Works
            </button>

            <button
              onClick={() => scrollToSection("pricing")}
              className="text-[14px] font-medium text-slate-700 transition-colors hover:text-blue-700"
            >
              Pricing
            </button>
          </nav>

          {/* Desktop right */}

          <div className="hidden items-center gap-3 md:flex">
            {/* Language */}

            <div className="relative">
              <button
                type="button"
                onClick={() => setLanguageOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:text-blue-700"
              >
                <Globe2 size={15} />

                <span>{language}</span>

                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    languageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {languageOpen && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="absolute right-0 top-8 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                >
                  {languages.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setLanguage(item);
                        setLanguageOpen(false);
                      }}
                      className={`block w-full rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                        language === item
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <span className="h-5 w-px bg-slate-300" />

            <Link
              to="/login"
              className="rounded-md border border-slate-400 px-4 py-2 text-[13px] font-semibold text-slate-800 transition-all hover:border-blue-600 hover:text-blue-700"
            >
              Log In
            </Link>

            <Link
              to="/signup"
              className="rounded-md bg-blue-700 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-blue-800 hover:shadow-md"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-slate-700 md:hidden"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}

        {mobileMenuOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="border-t border-slate-200 bg-white px-5 py-5 md:hidden"
          >
            <div className="flex flex-col gap-5">
              <button
                onClick={() => scrollToSection("features")}
                className="text-left text-[15px] font-medium text-slate-700"
              >
                Features
              </button>

              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left text-[15px] font-medium text-slate-700"
              >
                How It Works
              </button>

              <button
                onClick={() => scrollToSection("pricing")}
                className="text-left text-[15px] font-medium text-slate-700"
              >
                Pricing
              </button>

              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <Link
                  to="/login"
                  className="flex-1 rounded-md border border-slate-300 py-2.5 text-center text-[14px] font-semibold"
                >
                  Log In
                </Link>

                <Link
                  to="/signup"
                  className="flex-1 rounded-md bg-blue-700 py-2.5 text-center text-[14px] font-semibold text-white"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-24 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-24">
        {/* Background decoration */}

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-100/25 blur-3xl" />

          <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#94a3b8_0.6px,transparent_0.6px)] [background-size:22px_22px]" />
        </div>

        <div className="relative mx-auto max-w-[900px] text-center">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
            }}
          >
            <h1 className="mx-auto max-w-[800px] text-[38px] font-bold leading-[1.15] tracking-[-0.04em] text-slate-950 sm:text-[46px] lg:text-[52px]">
              Manage Your Computer Store Smarter
            </h1>

            <p className="mx-auto mt-6 max-w-[700px] text-[16px] leading-7 text-slate-600 sm:text-[17px]">
              Take control of your inventory, track sales and profits in
              real-time, and generate actionable reports. The all-in-one ERP
              built for IT retailers.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <motion.div
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="flex h-[48px] min-w-[135px] items-center justify-center gap-2 rounded-md bg-blue-700 px-6 text-[14px] font-semibold text-white shadow-md shadow-blue-700/15 transition-colors hover:bg-blue-800"
                >
                  Get Started
                  <ArrowRight size={17} />
                </motion.div>
              </Link>

              <button
                onClick={() => scrollToSection("dashboard-preview")}
                className="flex h-[48px] min-w-[140px] items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 text-[14px] font-medium text-slate-800 transition-all hover:border-blue-500 hover:text-blue-700"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-700">
                  <span className="ml-[1px] text-[9px]">▶</span>
                </span>
                View Demo
              </button>
            </div>
          </motion.div>
        </div>

        {/* =====================================================
            DASHBOARD PREVIEW
        ====================================================== */}

        <motion.div
          id="dashboard-preview"
          initial={{
            opacity: 0,
            y: 50,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.8,
          }}
          className="relative mx-auto mt-14 max-w-[1000px] sm:mt-16"
        >
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-white p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:rounded-2xl sm:p-2">
            <img
              src={dashboardPreview}
              alt="CompStore ERP dashboard"
              className="block h-auto w-full rounded-lg object-cover"
            />
          </div>
        </motion.div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================== */}

      <section
        id="features"
        className="bg-[#f1f2ff] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-24"
      >
        <div className="mx-auto max-w-[1100px]">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="text-center"
          >
            <h2 className="text-[32px] font-bold tracking-[-0.035em] text-slate-950 sm:text-[38px]">
              Everything you need to run your store
            </h2>

            <p className="mt-4 text-[15px] text-slate-600 sm:text-[16px]">
              Powerful tools designed specifically for hardware retailers and
              repair shops.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                  }}
                  whileHover={{
                    y: -4,
                  }}
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

      {/* =========================================================
          HOW IT WORKS / BENEFITS
      ========================================================== */}

      <section
        id="how-it-works"
        className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-24"
      >
        <div className="mx-auto grid max-w-[1100px] items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-14">
          {/* Image */}

          <motion.div
            initial={{
              opacity: 0,
              x: -35,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.7,
            }}
          >
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
              <img
                src={storeOwner}
                alt="Store owner using CompStore ERP"
                className="h-auto w-full object-cover"
              />
            </div>
          </motion.div>

          {/* Content */}

          <motion.div
            initial={{
              opacity: 0,
              x: 35,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.7,
            }}
          >
            <h2 className="text-[32px] font-bold tracking-[-0.035em] text-slate-950 sm:text-[38px]">
              Clarity Drives Profit
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

      {/* =========================================================
          PRICING PLACEHOLDER
      ========================================================== */}

      <section
        id="pricing"
        className="scroll-mt-20 bg-[#f1f2ff] px-5 py-20 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-[31px] font-bold tracking-[-0.03em] sm:text-[36px]">
            Simple pricing for growing stores
          </h2>

          <p className="mt-4 text-[15px] leading-6 text-slate-600 sm:text-[16px]">
            Choose the plan that fits your business. More pricing options can be
            added as the platform grows.
          </p>

          <motion.div
            whileHover={{
              y: -4,
            }}
            className="mx-auto mt-8 max-w-[390px] rounded-xl border border-slate-300 bg-white p-7 shadow-sm"
          >
            <p className="text-[15px] font-semibold text-blue-700">
              CompStore ERP
            </p>

            <h3 className="mt-3 text-3xl font-bold">Coming Soon</h3>

            <p className="mt-3 text-[14px] leading-6 text-slate-600">
              Professional inventory, sales, expense and reporting tools for
              your store.
            </p>

            <Link
              to="/signup"
              className="mt-6 flex h-12 items-center justify-center rounded-md bg-blue-700 text-[14px] font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}

      <footer className="border-t border-slate-300 bg-[#e5e6f1]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[15px] font-bold text-slate-950">
              CompStore ERP
            </span>

            <span className="hidden text-slate-400 sm:inline">|</span>

            <span className="text-[13px] text-slate-600">
              © 2024 CompStore ERP Solutions. All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-[13px] text-slate-700">
            <Link
              to="/privacy"
              className="transition-colors hover:text-blue-700"
            >
              Privacy Policy
            </Link>

            <Link to="/terms" className="transition-colors hover:text-blue-700">
              Terms of Service
            </Link>

            <Link
              to="/contact"
              className="transition-colors hover:text-blue-700"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landingpage;
