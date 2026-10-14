import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { motion } from "framer-motion";

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#faf9ff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-[58px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.025em] text-blue-700"
          >
            <FileText size={24} />
            CompStore ERP
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 py-16 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
        >
          <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            Terms of Service
          </h1>

          <p className="mt-3 text-sm text-slate-500">Last updated: 2024</p>

          <div className="mt-8 space-y-7 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                1. Acceptance of Terms
              </h2>

              <p className="mt-2">
                By accessing or using CompStore ERP, you agree to follow these
                Terms of Service. If you do not agree with these terms, you
                should not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                2. Account Responsibility
              </h2>

              <p className="mt-2">
                You are responsible for keeping your account credentials secure
                and for all activities performed through your account. You must
                provide accurate and updated information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                3. Acceptable Use
              </h2>

              <p className="mt-2">
                You agree not to misuse the platform, attempt unauthorized
                access, interfere with system security, upload harmful content,
                or use the service for illegal activities.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                4. Store Data
              </h2>

              <p className="mt-2">
                You are responsible for the accuracy of the inventory, sales,
                purchase, expense, customer, and financial information entered
                into your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                5. Service Availability
              </h2>

              <p className="mt-2">
                We aim to provide reliable service, but we cannot guarantee that
                the platform will always be available without interruption or
                errors.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                6. Changes to These Terms
              </h2>

              <p className="mt-2">
                We may update these terms from time to time. Continued use of
                the platform after changes are published means that you accept
                the updated terms.
              </p>
            </section>
          </div>

          <Link
            to="/contact"
            className="mt-8 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Contact Support
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default Terms;
