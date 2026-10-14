import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#faf9ff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-[58px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.025em] text-blue-700"
          >
            <ShieldCheck size={24} />
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
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm text-slate-500">Last updated: 2024</p>

          <div className="mt-8 space-y-7 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                1. Introduction
              </h2>

              <p className="mt-2">
                CompStore ERP is designed to help stores manage inventory,
                sales, purchases, expenses, customers, and business reports. We
                respect your privacy and are committed to protecting your
                information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                2. Information We Collect
              </h2>

              <p className="mt-2">
                We may collect information such as your name, email address,
                phone number, store information, transaction records, and
                account details when you use our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                3. How We Use Your Information
              </h2>

              <p className="mt-2">
                Your information may be used to provide and improve our
                services, manage your account, process store operations, provide
                customer support, and maintain platform security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                4. Data Security
              </h2>

              <p className="mt-2">
                We take reasonable technical and organizational measures to
                protect your information from unauthorized access, alteration,
                disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                5. Third-Party Services
              </h2>

              <p className="mt-2">
                Some features may use third-party services such as
                authentication, email delivery, hosting, or analytics. These
                services may process information according to their own privacy
                policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-950">
                6. Contact
              </h2>

              <p className="mt-2">
                If you have questions about this Privacy Policy, please visit
                our contact page.
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

export default Privacy;
