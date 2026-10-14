import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <div className="min-w-0 flex-1">
          <Topbar setMobileOpen={setMobileOpen} />

          <main className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
              }}
              className="mx-auto max-w-[1600px]"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
