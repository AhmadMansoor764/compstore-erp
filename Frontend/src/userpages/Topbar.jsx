import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Bell,
  Store,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const Topbar = ({ setMobileOpen }) => {
  const [branchOpen, setBranchOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);

  const { t, direction } = useLanguage();

  const handleComingSoon = () => {
    setComingSoon(true);

    setTimeout(() => {
      setComingSoon(false);
    }, 3000);
  };

  const periods = [
    { key: "today", label: t("topbar.periods.today") },
    { key: "week", label: t("topbar.periods.week") },
    { key: "month", label: t("topbar.periods.month") },
    { key: "year", label: t("topbar.periods.year") },
  ];

  return (
    <>
      {/* Coming Soon Message */}
      {comingSoon && (
        <div
          dir={direction}
          className={`fixed top-5 z-[100] rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl ${
            direction === "rtl" ? "left-5" : "right-5"
          }`}
        >
          {t("topbar.comingSoon")}
        </div>
      )}

      <header
        dir={direction}
        className="sticky top-0 z-30 border-b border-[#d5d8e7] bg-white/95 backdrop-blur"
      >
        <div className="flex min-h-[82px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left Side */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-[#d5d8e7] p-2.5 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label={t("topbar.openSidebar")}
            >
              <Menu size={23} />
            </button>

            <h2 className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">
              {t("topbar.greeting")}
            </h2>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 md:flex">
            {/* Branch Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setBranchOpen((prev) => !prev)}
                className="flex h-11 min-w-[178px] items-center justify-between gap-4 rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 text-sm font-medium text-slate-900 transition hover:bg-[#e8eafa]"
                aria-expanded={branchOpen}
              >
                <span>{t("topbar.mainBranch")}</span>
                <ChevronDown size={18} />
              </button>

              {branchOpen && (
                <div
                  className={`absolute mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl ${
                    direction === "rtl" ? "left-0" : "right-0"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setBranchOpen(false)}
                    className="w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-slate-100"
                  >
                    {t("topbar.mainBranch")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBranchOpen(false)}
                    className="w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-slate-100"
                  >
                    {t("topbar.secondBranch")}
                  </button>
                </div>
              )}
            </div>

            {/* Period Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPeriodOpen((prev) => !prev)}
                className="flex h-11 min-w-[165px] items-center justify-between gap-4 rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 text-sm font-medium text-slate-900 transition hover:bg-[#e8eafa]"
                aria-expanded={periodOpen}
              >
                <span>{t("topbar.periods.week")}</span>
                <CalendarDays size={20} />
              </button>

              {periodOpen && (
                <div
                  className={`absolute mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl ${
                    direction === "rtl" ? "left-0" : "right-0"
                  }`}
                >
                  {periods.map((period) => (
                    <button
                      type="button"
                      key={period.key}
                      onClick={() => setPeriodOpen(false)}
                      className="w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-slate-100"
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-[#c5c9dc]" />

            {/* Notification Button */}
            <button
              type="button"
              onClick={handleComingSoon}
              className="relative rounded-xl p-2.5 text-slate-800 transition hover:bg-slate-100"
              aria-label={t("topbar.notifications")}
              title={t("topbar.notifications")}
            >
              <Bell size={23} />

              <span
                className={`absolute top-2 h-2 w-2 rounded-full bg-red-500 ${
                  direction === "rtl" ? "left-2" : "right-2"
                }`}
              />
            </button>

            {/* Store Button */}
            <button
              type="button"
              onClick={handleComingSoon}
              className="rounded-xl p-2.5 text-slate-800 transition hover:bg-slate-100"
              aria-label={t("topbar.store")}
              title={t("topbar.store")}
            >
              <Store size={23} />
            </button>

            {/* Profile Button */}
            <Link
              to="/dashboard/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 transition hover:bg-slate-300"
              aria-label={t("topbar.goToProfile")}
              title={t("topbar.profile")}
            >
              <CircleUserRound size={27} className="text-slate-500" />
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Notification Button */}
            <button
              type="button"
              onClick={handleComingSoon}
              className="relative rounded-xl p-2 text-slate-800 hover:bg-slate-100"
              aria-label={t("topbar.notifications")}
              title={t("topbar.notifications")}
            >
              <Bell size={22} />

              <span
                className={`absolute top-1.5 h-2 w-2 rounded-full bg-red-500 ${
                  direction === "rtl" ? "left-1.5" : "right-1.5"
                }`}
              />
            </button>

            {/* Mobile Profile Button */}
            <Link
              to="/dashboard/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 transition hover:bg-slate-300"
              aria-label={t("topbar.goToProfile")}
              title={t("topbar.profile")}
            >
              <CircleUserRound size={24} className="text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-4 md:hidden">
          <button
            type="button"
            onClick={handleComingSoon}
            className="flex shrink-0 items-center gap-3 rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 py-2.5 text-sm font-medium"
          >
            {t("topbar.mainBranch")}
            <ChevronDown size={16} />
          </button>

          <button
            type="button"
            onClick={handleComingSoon}
            className="flex shrink-0 items-center gap-3 rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 py-2.5 text-sm font-medium"
          >
            {t("topbar.periods.week")}
            <CalendarDays size={17} />
          </button>
        </div>
      </header>
    </>
  );
};

export default Topbar;
