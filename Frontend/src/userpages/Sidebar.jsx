import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ReceiptText,
  BarChart3,
  UserRound,
  LogOut,
  ClipboardList,
  Store,
  X,
  Plus,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

const navigationItems = [
  { label: "dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "stock", path: "/dashboard/stock", icon: Package },
  { label: "sales", path: "/dashboard/sales", icon: ShoppingCart },
  { label: "purchases", path: "/dashboard/purchases", icon: ClipboardList },
  { label: "expenses", path: "/dashboard/expenses", icon: ReceiptText },
  { label: "reports", path: "/dashboard/reports", icon: BarChart3 },
  { label: "profile", path: "/dashboard/profile", icon: UserRound },
  { label: "suppliers", path: "/dashboard/suppliers", icon: Store },
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { isRTL } = useLanguage();
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        dir={isRTL ? "rtl" : "ltr"}
        className={`hidden min-h-screen  w-[285px] shrink-0 flex-col border-r border-[#c5c9dc] bg-[#f3f4ff] lg:flex ${
          isRTL ? "border-r-0 border-l" : ""
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        dir={isRTL ? "rtl" : "ltr"}
        className={`fixed inset-y-0 z-50 flex w-[285px] flex-col bg-[#f3f4ff] shadow-2xl transition-transform duration-300 lg:hidden ${
          isRTL
            ? `right-0 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`
            : `left-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
        }`}
      >
        {/* Mobile Header */}
        <div
          className={`flex shrink-0 items-center justify-between px-5 py-5 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <div
            className={`flex items-center gap-3 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e1e4f2]">
              <Store size={24} className="text-[#2563eb]" />
            </div>

            <div className={isRTL ? "text-right" : "text-left"}>
              <h1 className="text-lg font-bold text-[#1746b8]">
                <SidebarText translationKey="mainBranch" />
              </h1>

              <p className="text-xs font-medium text-slate-700">
                <SidebarText translationKey="adminTerminal" />
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close sidebar"
            className="shrink-0 rounded-lg p-2 text-slate-700 hover:bg-white"
          >
            <X size={22} />
          </button>
        </div>

        <SidebarContent closeMobile={closeMobile} />
      </aside>
    </>
  );
};

/* Shared translation component */
const SidebarText = ({ translationKey }) => {
  const { t } = useLanguage();

  return t(`sidebar.${translationKey}`);
};

const SidebarContent = ({ closeMobile }) => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const contentType = response.headers.get("content-type");

      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok || (typeof data === "object" && !data.success)) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.message || t("sidebar.logoutFailed"),
        );
      }

      closeMobile?.();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);

      toast.error(error.message || t("sidebar.logoutError"));
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Branch Header */}
      <div
        className={`flex shrink-0 items-center gap-4 px-6 py-5 ${
          isRTL ? "flex-row-reverse text-right" : "text-left"
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e1e4f2]">
          <Store size={24} className="text-[#2563eb]" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-[#1746b8]">
            {t("sidebar.mainBranch")}
          </h1>

          <p className="text-sm font-medium tracking-wide text-slate-700">
            {t("sidebar.adminTerminal")}
          </p>
        </div>
      </div>

      {/* New Sale Button */}
      <div className="shrink-0 px-4 pt-5">
        <Link
          to="/dashboard/sales/new"
          onClick={closeMobile}
          className={`flex h-[53px] items-center justify-center gap-3 rounded-xl bg-[#2563eb] text-base font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <Plus size={23} />
          {t("sidebar.newSale")}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-6 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={closeMobile}
              className={({ isActive }) =>
                `group flex h-[51px] shrink-0 items-center gap-4 rounded-xl px-5 text-[15px] font-medium transition ${
                  isRTL ? "flex-row-reverse text-right" : "text-left"
                } ${
                  isActive
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "text-slate-700 hover:bg-white hover:text-[#2563eb]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={23}
                    strokeWidth={isActive ? 2.4 : 2}
                    className={`shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-slate-700 group-hover:text-[#2563eb]"
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    {t(`sidebar.${item.label}`)}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="shrink-0 space-y-2 px-4 pb-7 pt-3">
        <div className="mb-5 h-px bg-[#c5c9dc]" />

        <button
          type="button"
          onClick={handleLogout}
          className={`flex h-[50px] w-full items-center gap-4 rounded-xl px-5 text-[15px] font-medium text-slate-700 transition hover:bg-white hover:text-red-600 ${
            isRTL ? "flex-row-reverse text-right" : "text-left"
          }`}
        >
          <LogOut size={23} className="shrink-0" />
          <span>{t("sidebar.signOut")}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
