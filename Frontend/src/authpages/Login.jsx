import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Store,
  TrendingUp,
  Globe2,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

const Login = () => {
  const navigate = useNavigate();
  const { language, changeLanguage, isRTL, t } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const languages = [
    { label: "English (US)", value: "en" },
    { label: "فارسی", value: "fa" },
    { label: "پښتو", value: "ps" },
  ];

  const currentLanguage =
    languages.find((item) => item.value === language) || languages[0];

  const handleLanguageChange = (nextLanguage) => {
    changeLanguage(nextLanguage);
    setShowLanguageMenu(false);
  };

  // LOGIN
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email.trim().toLowerCase(),
            password: data.password,
          }),
        },
      );

      const contentType = response.headers.get("content-type");
      const result = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message =
          typeof result === "string"
            ? result
            : result?.message || t("login.failed");

        throw new Error(message);
      }

      toast.success(
        typeof result === "object" && result?.message
          ? result.message
          : t("login.success"),
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || t("login.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  // GOOGLE LOGIN
  const handleGoogleSuccess = async (googleResponse) => {
    try {
      const credential = googleResponse?.credential;

      if (!credential) {
        throw new Error(t("login.googleError"));
      }

      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential }),
        },
      );

      const contentType = response.headers.get("content-type");
      const result = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok || (typeof result === "object" && !result.success)) {
        throw new Error(
          typeof result === "string"
            ? result
            : result?.message || t("login.googleFailed"),
        );
      }

      toast.success(
        typeof result === "object" && result?.message
          ? result.message
          : t("login.googleSuccess"),
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.message || t("login.googleFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error(t("login.googleFailed"));
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen w-full bg-white text-slate-900"
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LOGIN SIDE */}
        <section className="relative flex min-h-screen flex-col overflow-hidden bg-white">
          {/* LANGUAGE SELECTOR */}
          <div
            className={`absolute top-6 z-30 sm:top-8 ${
              isRTL
                ? "left-6 sm:left-10 lg:left-12"
                : "right-6 sm:right-10 lg:right-12"
            }`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageMenu((prev) => !prev)}
                className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-expanded={showLanguageMenu}
              >
                <Globe2 size={18} className="text-slate-700" />
                <span>{currentLanguage.label}</span>
                <ChevronDown
                  size={15}
                  className={`transition-transform ${
                    showLanguageMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showLanguageMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ${
                    isRTL ? "left-0" : "right-0"
                  }`}
                >
                  {languages.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleLanguageChange(item.value)}
                      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isRTL ? "text-right" : "text-left"
                      } ${
                        language === item.value
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-24 sm:px-8 lg:px-12 lg:pb-16 lg:pt-20">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-[530px]"
            >
              {/* LOGO */}
              <motion.div variants={itemVariants}>
                <Link to="/" className="group inline-flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/20"
                  >
                    <Store size={23} strokeWidth={2.2} className="text-white" />
                  </motion.div>
                  <span className="text-[25px] font-bold tracking-[-0.02em] text-blue-700">
                    CompStore ERP
                  </span>
                </Link>
              </motion.div>

              {/* HEADING */}
              <motion.div variants={itemVariants} className="mt-8 sm:mt-9">
                <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-[40px]">
                  {t("login.title")}
                </h1>
                <p className="mt-3 max-w-[500px] text-[16px] leading-7 text-slate-600 sm:text-[17px]">
                  {t("login.description")}
                </p>
              </motion.div>

              {/* LOGIN FORM */}
              <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="mt-7 sm:mt-8"
              >
                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[13px] font-semibold tracking-[0.02em] text-slate-700"
                  >
                    {t("login.email")}
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                        isRTL ? "right-3.5" : "left-3.5"
                      }`}
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      dir="ltr"
                      placeholder="admin@compstore.com"
                      {...register("email", {
                        required: t("login.emailRequired"),
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: t("login.emailInvalid"),
                        },
                      })}
                      className={`h-[50px] w-full rounded-md border bg-white ${
                        isRTL ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                      } text-[15px] text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:ring-4 ${
                        errors.email
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/10"
                      }`}
                    />
                  </div>

                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-medium text-red-500"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="text-[13px] font-semibold tracking-[0.02em] text-slate-700"
                    >
                      {t("login.password")}
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[13px] font-semibold text-blue-600 transition-colors hover:text-blue-700"
                    >
                      {t("login.forgotPassword")}
                    </Link>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                        isRTL ? "right-3.5" : "left-3.5"
                      }`}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      dir="ltr"
                      placeholder="••••••••"
                      {...register("password", {
                        required: t("login.passwordRequired"),
                      })}
                      className={`h-[50px] w-full rounded-md border bg-white ${
                        isRTL
                          ? "pr-11 pl-12 text-right"
                          : "pl-11 pr-12 text-left"
                      } text-[15px] tracking-wider text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:ring-4 ${
                        errors.password
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/10"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none ${
                        isRTL ? "left-3.5" : "right-3.5"
                      }`}
                      aria-label={
                        showPassword
                          ? t("login.hidePassword")
                          : t("login.showPassword")
                      }
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>

                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-medium text-red-500"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                {/* REMEMBER ME */}
                <div className="mt-4">
                  <label className="inline-flex cursor-pointer items-center gap-2.5 text-[14px] text-slate-700">
                    <input
                      type="checkbox"
                      {...register("remember")}
                      className="h-[18px] w-[18px] cursor-pointer rounded-[4px] border border-slate-300 accent-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                    <span>{t("login.rememberMe")}</span>
                  </label>
                </div>

                {/* SUBMIT */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { y: -1 } : {}}
                  whileTap={!isLoading ? { scale: 0.99 } : {}}
                  className="mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-[15px] font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>{t("login.submitting")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("login.submit")}</span>
                      <ArrowRight size={19} strokeWidth={2} />
                    </>
                  )}
                </motion.button>
              </motion.form>

              {/* DIVIDER */}
              <motion.div
                variants={itemVariants}
                className="my-7 flex items-center gap-3"
              >
                <div className="h-px flex-1 bg-slate-300" />
                <span className="shrink-0 text-[13px] font-medium text-slate-500">
                  {t("login.divider")}
                </span>
                <div className="h-px flex-1 bg-slate-300" />
              </motion.div>

              {/* GOOGLE LOGIN */}
              <motion.div
                variants={itemVariants}
                className="relative h-[50px] w-full overflow-hidden rounded-md"
              >
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center gap-3 rounded-md border border-slate-300 bg-white text-[15px] font-medium text-slate-800">
                  <span className="bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 bg-clip-text text-[21px] font-bold leading-none text-transparent">
                    G
                  </span>
                  <span>{t("login.google")}</span>
                </div>
                <div className="relative z-10 flex h-full w-full justify-center opacity-0">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    width="320"
                    text="continue_with"
                    shape="rectangular"
                    theme="outline"
                    size="large"
                  />
                </div>
              </motion.div>

              {/* SIGNUP LINK */}
              <motion.p
                variants={itemVariants}
                className="mt-7 text-center text-[14px] text-slate-600"
              >
                {t("login.noAccount")}{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  {t("login.signupLink")}
                </Link>
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* RIGHT SIDE — PRODUCT VISUAL */}
        <section className="relative hidden min-h-screen overflow-hidden bg-[#f4f5ff] lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 opacity-[0.32] [background-image:radial-gradient(#94a3b8_0.7px,transparent_0.7px)] [background-size:20px_20px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-blue-200/20 blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute -bottom-24 -left-24 h-[350px] w-[350px] rounded-full bg-indigo-200/20 blur-3xl"
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="relative z-10 w-[78%] max-w-[650px]"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{
                y: -5,
                boxShadow: "0 25px 50px rgba(15, 23, 42, 0.12)",
              }}
              className="overflow-hidden rounded-[15px] border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/10 transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold tracking-[0.09em] text-slate-700">
                    {t("login.revenue")}
                  </p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-2 text-[40px] font-bold tracking-[-0.04em] text-slate-950"
                    dir="ltr"
                  >
                    $124,592.00
                  </motion.p>
                </div>

                <div
                  className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-[12px] font-bold text-emerald-700"
                  dir="ltr"
                >
                  <TrendingUp size={14} />
                  +14.5%
                </div>
              </div>

              <div className="mt-8">
                <div className="flex h-[105px] items-end gap-2">
                  {[
                    { day: "Mon", height: "42%" },
                    { day: "Tue", height: "57%" },
                    { day: "Wed", height: "46%" },
                    { day: "Thu", height: "68%" },
                    { day: "Fri", height: "63%" },
                    { day: "Sat", height: "81%" },
                    { day: "Sun", height: "94%" },
                  ].map((item, index) => (
                    <div
                      key={item.day}
                      className="flex h-full flex-1 items-end"
                    >
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: item.height, opacity: 1 }}
                        transition={{
                          duration: 0.65,
                          delay: 0.35 + index * 0.08,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`w-full rounded-t-[4px] ${
                          index === 6
                            ? "bg-blue-700"
                            : index === 5
                              ? "bg-blue-600"
                              : index === 3 || index === 4
                                ? "bg-blue-500/75"
                                : "bg-blue-500/30"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2" dir="ltr">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <span
                        key={day}
                        className="flex-1 text-center text-[12px] font-medium text-slate-500"
                      >
                        {t(`login.days.${day}`)}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mx-auto mt-10 max-w-[570px] text-center"
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <BarChart3 size={22} className="text-white" />
              </div>

              <h2 className="text-[25px] font-bold tracking-[-0.025em] text-slate-950">
                {t("login.visualTitle")}
              </h2>

              <p className="mx-auto mt-3 max-w-[550px] text-[16px] leading-7 text-slate-600">
                {t("login.visualDescription")}
              </p>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </main>
  );
};

export default Login;
