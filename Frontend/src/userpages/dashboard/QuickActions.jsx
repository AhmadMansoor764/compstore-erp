import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PackagePlus, ReceiptText, UserRoundPlus } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const QuickActions = () => {
  const { t, isRTL } = useLanguage();

  const actions = [
    {
      key: "addStock",
      icon: PackagePlus,
      path: "/dashboard/stock/add",
    },
    {
      key: "recordExpense",
      icon: ReceiptText,
      path: "/dashboard/expenses/new",
    },
    {
      key: "addCustomer",
      icon: UserRoundPlus,
      path: "/dashboard/customers/new",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      dir={isRTL ? "rtl" : "ltr"}
      className="rounded-2xl border border-[#c8cce0] bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-5 text-lg font-bold text-slate-950">
        {t("quickActions.title")}
      </h3>

      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.key}
              to={action.path}
              className="flex min-h-[54px] items-center gap-4 rounded-xl border border-[#c8cce0] px-4 transition hover:border-[#2563eb] hover:bg-[#f5f7ff]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef0fb] text-slate-800">
                <Icon size={21} aria-hidden="true" />
              </span>

              <span className="text-sm font-medium text-slate-900 sm:text-base">
                {t(`quickActions.${action.key}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickActions;
