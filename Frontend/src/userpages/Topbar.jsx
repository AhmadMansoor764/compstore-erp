import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Bell,
  Store,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  UsersRound,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const Topbar = ({ setMobileOpen }) => {
  const [branchOpen, setBranchOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState("main");
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const { t, direction } = useLanguage();

  const handleComingSoon = () => {
    setComingSoon(true);
  };

  useEffect(() => {
    if (!comingSoon) return;

    const timeoutId = setTimeout(() => {
      setComingSoon(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [comingSoon]);

  const periods = [
    { key: "today", label: t("topbar.periods.today") },
    { key: "week", label: t("topbar.periods.week") },
    { key: "month", label: t("topbar.periods.month") },
    { key: "year", label: t("topbar.periods.year") },
  ];

  const branches = [
    { key: "main", label: t("topbar.mainBranch") },
    { key: "second", label: t("topbar.secondBranch") },
  ];

  const currentBranch =
    branches.find((branch) => branch.key === selectedBranch)?.label ??
    t("topbar.mainBranch");

  const currentPeriod =
    periods.find((period) => period.key === selectedPeriod)?.label ??
    t("topbar.periods.week");

  const dropdownPosition = direction === "rtl" ? "left-0" : "right-0";

  const dropdownClass = `absolute top-full z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ${dropdownPosition}`;

  const optionClass =
    "w-full rounded-lg px-3 py-2 text-start text-sm text-slate-700 transition hover:bg-slate-100";

  const selectBranch = (key) => {
    setSelectedBranch(key);
    setBranchOpen(false);
  };

  const selectPeriod = (key) => {
    setSelectedPeriod(key);
    setPeriodOpen(false);
  };

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
        {/* Main Topbar */}
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
                onClick={() => {
                  setBranchOpen((prev) => !prev);
                  setPeriodOpen(false);
                }}
                className="flex h-11 min-w-[178px] items-center justify-between gap-4 rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 text-sm font-medium text-slate-900 transition hover:bg-[#e8eafa]"
                aria-expanded={branchOpen}
              >
                <span>{currentBranch}</span>
                <ChevronDown size={18} />
              </button>

              {branchOpen && (
                <div className={dropdownClass}>
                  {branches.map((branch) => (
                    <button
                      key={branch.key}
                      type="button"
                      onClick={() => selectBranch(branch.key)}
                      className={`${optionClass} ${
                        selectedBranch === branch.key
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : ""
                      }`}
                    >
                      {branch.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Period Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPeriodOpen((prev) => !prev);
                  setBranchOpen(false);
                }}
                className="flex h-11 min-w-[165px] items-center justify-between gap-4 rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 text-sm font-medium text-slate-900 transition hover:bg-[#e8eafa]"
                aria-expanded={periodOpen}
              >
                <span>{currentPeriod}</span>
                <CalendarDays size={20} />
              </button>

              {periodOpen && (
                <div className={dropdownClass}>
                  {periods.map((period) => (
                    <button
                      key={period.key}
                      type="button"
                      onClick={() => selectPeriod(period.key)}
                      className={`${optionClass} ${
                        selectedPeriod === period.key
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : ""
                      }`}
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
            {/* Notification Button */}
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

            {/* Profile Button */}
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
          {/* Mobile Branch Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setBranchOpen((prev) => !prev);
                setPeriodOpen(false);
              }}
              className="flex items-center gap-3 whitespace-nowrap rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 py-2.5 text-sm font-medium text-slate-900"
              aria-expanded={branchOpen}
            >
              {currentBranch}
              <ChevronDown size={16} />
            </button>

            {branchOpen && (
              <div className={dropdownClass}>
                {branches.map((branch) => (
                  <button
                    key={branch.key}
                    type="button"
                    onClick={() => selectBranch(branch.key)}
                    className={`${optionClass} ${
                      selectedBranch === branch.key
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : ""
                    }`}
                  >
                    {branch.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Period Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setPeriodOpen((prev) => !prev);
                setBranchOpen(false);
              }}
              className="flex items-center gap-3 whitespace-nowrap rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 py-2.5 text-sm font-medium text-slate-900"
              aria-expanded={periodOpen}
            >
              {currentPeriod}
              <CalendarDays size={17} />
            </button>

            {periodOpen && (
              <div className={dropdownClass}>
                {periods.map((period) => (
                  <button
                    key={period.key}
                    type="button"
                    onClick={() => selectPeriod(period.key)}
                    className={`${optionClass} ${
                      selectedPeriod === period.key
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : ""
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suppliers Shortcut */}
          <Link
            to="/dashboard/suppliers"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 py-2.5 text-sm font-medium text-slate-900"
          >
            <UsersRound size={17} />
            {t("sidebar.suppliers")}
          </Link>
        </div>
      </header>
    </>
  );
};

export default Topbar;
