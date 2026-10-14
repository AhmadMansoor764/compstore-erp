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

const Topbar = ({ setMobileOpen }) => {
  const [branchOpen, setBranchOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);

  const handleComingSoon = () => {
    setComingSoon(true);

    setTimeout(() => {
      setComingSoon(false);
    }, 3000);
  };

  return (
    <>
      {/* Coming Soon Message */}
      {comingSoon && (
        <div className="fixed right-5 top-5 z-[100] rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          Coming soon
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-[#d5d8e7] bg-white/95 backdrop-blur">
        <div className="flex min-h-[82px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left Side */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-[#d5d8e7] p-2.5 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={23} />
            </button>

            <h2 className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">
              Good morning, Store Admin
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
              >
                <span>Main Branch</span>
                <ChevronDown size={18} />
              </button>

              {branchOpen && (
                <div className="absolute right-0 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <button
                    type="button"
                    onClick={() => setBranchOpen(false)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                  >
                    Main Branch
                  </button>

                  <button
                    type="button"
                    onClick={() => setBranchOpen(false)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                  >
                    Second Branch
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
              >
                <span>This Week</span>
                <CalendarDays size={20} />
              </button>

              {periodOpen && (
                <div className="absolute right-0 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {["Today", "This Week", "This Month", "This Year"].map(
                    (period) => (
                      <button
                        type="button"
                        key={period}
                        onClick={() => setPeriodOpen(false)}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                      >
                        {period}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-[#c5c9dc]" />

            {/* Notification Button */}
            <button
              type="button"
              onClick={handleComingSoon}
              className="relative rounded-xl p-2.5 text-slate-800 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={23} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Store Button */}
            <button
              type="button"
              onClick={handleComingSoon}
              className="rounded-xl p-2.5 text-slate-800 transition hover:bg-slate-100"
              aria-label="Store"
            >
              <Store size={23} />
            </button>

            {/* Profile Button */}
            <Link
              to="/dashboard/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 transition hover:bg-slate-300"
              aria-label="Go to profile"
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
              aria-label="Notifications"
            >
              <Bell size={22} />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Mobile Profile Button */}
            <Link
              to="/dashboard/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 transition hover:bg-slate-300"
              aria-label="Go to profile"
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
            Main Branch
            <ChevronDown size={16} />
          </button>

          <button
            type="button"
            onClick={handleComingSoon}
            className="flex shrink-0 items-center gap-3 rounded-xl border border-[#c4c9df] bg-[#f0f1fb] px-4 py-2.5 text-sm font-medium"
          >
            This Week
            <CalendarDays size={17} />
          </button>
        </div>
      </header>
    </>
  );
};

export default Topbar;
