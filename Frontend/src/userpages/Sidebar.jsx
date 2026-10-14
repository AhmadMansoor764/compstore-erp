import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

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

const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Stock", path: "/dashboard/stock", icon: Package },
  { label: "Sales", path: "/dashboard/sales", icon: ShoppingCart },
  { label: "Purchases", path: "/dashboard/purchases", icon: ClipboardList },
  { label: "Expenses", path: "/dashboard/expenses", icon: ReceiptText },
  { label: "Reports", path: "/dashboard/reports", icon: BarChart3 },
  { label: "Profile", path: "/dashboard/profile", icon: UserRound },
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden min-h-screen w-[285px] shrink-0 flex-col border-r border-[#c5c9dc] bg-[#f3f4ff] lg:flex">
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[285px] flex-col bg-[#f3f4ff] shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e1e4f2]">
              <Store size={24} className="text-[#2563eb]" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-[#1746b8]">Main Branch</h1>
              <p className="text-xs font-medium text-slate-700">
                Admin Terminal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-700 hover:bg-white"
          >
            <X size={22} />
          </button>
        </div>

        <SidebarContent closeMobile={closeMobile} />
      </aside>
    </>
  );
};

const SidebarContent = ({ closeMobile }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Logout failed");
      }

      closeMobile?.();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to sign out. Please try again.");
    }
  };

  return (
    <>
      {/* Branch Header */}
      <div className="flex items-center gap-4 px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e1e4f2]">
          <Store size={24} className="text-[#2563eb]" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#1746b8]">Main Branch</h1>
          <p className="text-sm font-medium tracking-wide text-slate-700">
            Admin Terminal
          </p>
        </div>
      </div>

      {/* New Sale Button */}
      <div className="px-4 pt-5">
        <Link
          to="/dashboard/sales/new"
          onClick={closeMobile}
          className="flex h-[53px] items-center justify-center gap-3 rounded-xl bg-[#2563eb] text-base font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
        >
          <Plus size={23} />
          New Sale
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 space-y-2 px-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={closeMobile}
              className={({ isActive }) =>
                `group flex h-[51px] items-center gap-4 rounded-xl px-5 text-[15px] font-medium transition ${
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
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-700 group-hover:text-[#2563eb]"
                    }
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="space-y-2 px-4 pb-7">
        <div className="mb-5 h-px bg-[#c5c9dc]" />

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-[50px] w-full items-center gap-4 rounded-xl px-5 text-[15px] font-medium text-slate-700 transition hover:bg-white hover:text-red-600"
        >
          <LogOut size={23} />
          Sign Out
        </button>
      </div>
    </>
  );
};

export default Sidebar;
