import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Send } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

const Contact = () => {
  const { t, isRTL } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    toast.success(t("contact.success"));

    setFormData({
      name: "",
      email: "",
      message: "",
    });
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-[#faf9ff] text-slate-950"
    >
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-[58px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            className="text-[17px] font-bold tracking-[-0.025em] text-blue-700"
          >
            CompStore ERP
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-blue-700"
          >
            <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
            {t("contact.backHome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 25 : -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              {t("contact.title")}
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {t("contact.description")}
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 shrink-0 text-blue-700" size={20} />

                <div>
                  <h2 className="font-semibold text-slate-950">
                    {t("contact.email")}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600" dir="ltr">
                    support@compstoreerp.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-1 shrink-0 text-blue-700" size={20} />

                <div>
                  <h2 className="font-semibold text-slate-950">
                    {t("contact.location")}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {t("contact.country")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: isRTL ? -25 : 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div>
              <label
                htmlFor="contact-name"
                className="text-sm font-semibold text-slate-800"
              >
                {t("contact.name")}
              </label>

              <input
                id="contact-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
                className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder={t("contact.namePlaceholder")}
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="contact-email"
                className="text-sm font-semibold text-slate-800"
              >
                {t("contact.emailAddress")}
              </label>

              <input
                id="contact-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                dir="ltr"
                className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder={t("contact.emailPlaceholder")}
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="contact-message"
                className="text-sm font-semibold text-slate-800"
              >
                {t("contact.message")}
              </label>

              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder={t("contact.messagePlaceholder")}
              />
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t("contact.send")}
              <Send size={16} className={isRTL ? "rotate-180" : ""} />
            </button>
          </motion.form>
        </div>
      </main>
    </div>
  );
};

export default Contact;
