import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Store,
  User,
  Globe2,
  ChevronDown,
  Star,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

const Signup = () => {
  const navigate = useNavigate();
  const { language, direction, changeLanguage, isRTL, t } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

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

  // NORMAL SIGNUP
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.fullName.trim(),
            email: data.email.trim().toLowerCase(),
            password: data.password,
            confirm_password: data.confirmPassword,
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
            : result?.message || t("signup.failed");

        throw new Error(message);
      }

      toast.success(
        typeof result === "object" && result?.message
          ? result.message
          : t("signup.success"),
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);

      if (error instanceof TypeError) {
        toast.error(t("signup.connectionError"));
      } else {
        toast.error(error.message || t("signup.failed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // GOOGLE SIGNUP
  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error(t("signup.googleError"));
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        },
      );

      const contentType = response.headers.get("content-type");
      const result = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof result === "string"
            ? result
            : result?.message || t("signup.googleFailed"),
        );
      }

      toast.success(
        typeof result === "object" && result?.message
          ? result.message
          : t("signup.googleSuccess"),
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Google signup error:", error);
      toast.error(error.message || t("signup.googleFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error(t("signup.googleFailed"));
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

  const leftVariants = {
    hidden: { opacity: 0, x: isRTL ? 25 : -25 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <main
      dir={direction}
      lang={language}
      className="min-h-screen w-full bg-white text-slate-900"
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}
        <section className="relative hidden min-h-screen overflow-hidden bg-[#f3f4ff] lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:radial-gradient(#94a3b8_0.65px,transparent_0.65px)] [background-size:20px_20px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1 }}
            className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-200/20 blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.2 }}
            className="pointer-events-none absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-indigo-200/20 blur-3xl"
          />

          {/* LOGO */}
          <motion.div
            variants={leftVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 px-9 pt-10 xl:px-10"
          >
            <Link to="/" className="group inline-flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/20"
              >
                <Store size={23} strokeWidth={2.3} className="text-white" />
              </motion.div>

              <span className="text-[25px] font-bold tracking-[-0.025em] text-blue-700">
                CompStore ERP
              </span>
            </Link>
          </motion.div>

          {/* LEFT CONTENT */}
          <div
            className={`relative z-10 flex flex-1 flex-col justify-between px-9 pb-9 pt-20 xl:px-10 xl:pb-10 ${isRTL ? "text-right" : "text-left"}`}
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-[600px]"
            >
              <motion.h1
                variants={itemVariants}
                className="text-[40px] font-bold leading-[1.12] tracking-[-0.04em] text-slate-950 xl:text-[42px]"
              >
                {t("signup.signupHeadline")}
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mt-5 max-w-[550px] text-[17px] leading-7 text-slate-700"
              >
                {t("signup.signupDescription")}
              </motion.p>
            </motion.div>

            {/* TESTIMONIAL */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="w-full max-w-[485px] rounded-xl border border-slate-300/90 bg-white p-7 shadow-sm xl:p-8"
            >
              <div className="flex items-center gap-3" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.5 + star * 0.07,
                    }}
                  >
                    <Star
                      size={22}
                      strokeWidth={2}
                      className="text-emerald-700"
                    />
                  </motion.div>
                ))}
              </div>

              <p
                className={`mt-5 text-[15px] italic leading-6 text-slate-800 ${isRTL ? "text-right" : "text-left"}`}
              >
                {t("signup.testimonial")}
              </p>

              <div
                className={`mt-6 flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                  <User size={21} className="text-slate-500" />
                </div>

                <div className={isRTL ? "text-right" : "text-left"}>
                  <p className="text-[14px] font-semibold tracking-wide text-slate-900">
                    {t("signup.testimonialName")}
                  </p>
                  <p className="text-[13px] tracking-wide text-slate-600">
                    {t("signup.testimonialRole")}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#faf9ff]">
          {/* LANGUAGE SELECTOR */}
          <div
            className={`absolute top-5 z-30 sm:top-7 lg:top-8 ${
              isRTL
                ? "left-5 sm:left-8 lg:left-10"
                : "right-5 sm:right-8 lg:right-10"
            }`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageMenu((prev) => !prev)}
                className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-expanded={showLanguageMenu}
              >
                <Globe2 size={17} strokeWidth={2} className="text-slate-700" />
                <span>
                  {currentLanguage.value === "en"
                    ? "EN"
                    : currentLanguage.label}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${showLanguageMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showLanguageMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ${
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

          {/* FORM */}
          <div className="flex flex-1 items-center justify-center px-5 py-24 sm:px-8 lg:px-12 lg:py-16">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={`w-full max-w-[500px] ${isRTL ? "text-right" : "text-left"}`}
            >
              {/* HEADING */}
              <motion.div variants={itemVariants}>
                <h2 className="text-[32px] font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-[34px]">
                  {t("signup.title")}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("signup.description")}
                </p>
              </motion.div>

              {/* SIGNUP FORM */}
              <motion.form
                dir={direction}
                variants={itemVariants}
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="mt-7"
              >
                {/* FULL NAME */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-start text-[13px] font-semibold tracking-[0.02em] text-slate-800"
                  >
                    {t("signup.fullName")}
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    dir={direction}
                    placeholder={t("signup.fullNamePlaceholder")}
                    {...register("fullName", {
                      required: t("signup.nameRequired"),
                      minLength: {
                        value: 2,
                        message: t("signup.nameMinLength"),
                      },
                    })}
                    className={`h-[50px] w-full rounded-md border bg-white px-4 text-start text-[15px] text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:ring-4 ${
                      errors.fullName
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                        : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/10"
                    }`}
                  />

                  {errors.fullName && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-medium text-red-500"
                    >
                      {errors.fullName.message}
                    </motion.p>
                  )}
                </div>

                {/* EMAIL */}
                <div className="mt-4">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-start text-[13px] font-semibold tracking-[0.02em] text-slate-800"
                  >
                    {t("signup.email")}
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    placeholder="john@example.com"
                    {...register("email", {
                      required: t("signup.emailRequired"),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t("signup.emailInvalid"),
                      },
                    })}
                    className={`h-[50px] w-full rounded-md border bg-white px-4 text-left text-[15px] text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:ring-4 ${
                      errors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                        : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/10"
                    }`}
                  />

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
                <div className="mt-4">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-start text-[13px] font-semibold tracking-[0.02em] text-slate-800"
                  >
                    {t("signup.password")}
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      dir="ltr"
                      placeholder="••••••••"
                      {...register("password", {
                        required: t("signup.passwordRequired"),
                        minLength: {
                          value: 8,
                          message: t("signup.passwordMinLength"),
                        },
                      })}
                      className={`h-[50px] w-full rounded-md border bg-white pl-4 pr-12 text-left text-[15px] tracking-wider text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:ring-4 ${
                        errors.password
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/10"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none"
                      aria-label={
                        showPassword
                          ? t("signup.hidePassword")
                          : t("signup.showPassword")
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

                {/* CONFIRM PASSWORD */}
                <div className="mt-4">
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-start text-[13px] font-semibold tracking-[0.02em] text-slate-800"
                  >
                    {t("signup.confirmPassword")}
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      dir="ltr"
                      placeholder="••••••••"
                      {...register("confirmPassword", {
                        required: t("signup.confirmPasswordRequired"),
                        validate: (value) =>
                          value === password || t("signup.passwordMismatch"),
                      })}
                      className={`h-[50px] w-full rounded-md border bg-white pl-4 pr-12 text-left text-[15px] tracking-wider text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:ring-4 ${
                        errors.confirmPassword
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/10"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none"
                      aria-label={
                        showConfirmPassword
                          ? t("signup.hidePassword")
                          : t("signup.showPassword")
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-medium text-red-500"
                    >
                      {errors.confirmPassword.message}
                    </motion.p>
                  )}
                </div>

                {/* CREATE ACCOUNT */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { y: -1 } : {}}
                  whileTap={!isLoading ? { scale: 0.99 } : {}}
                  className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-[15px] font-semibold text-white shadow-sm shadow-blue-700/20 transition-all hover:bg-blue-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>{t("signup.submitting")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("signup.submit")}</span>
                      <ArrowRight
                        size={18}
                        strokeWidth={2}
                        className={isRTL ? "rotate-180" : ""}
                      />
                    </>
                  )}
                </motion.button>
              </motion.form>

              {/* DIVIDER */}
              <motion.div
                variants={itemVariants}
                className="my-6 flex items-center gap-4"
              >
                <div className="h-px flex-1 bg-slate-300" />
                <span className="shrink-0 text-[13px] font-medium text-slate-600">
                  {t("signup.divider")}
                </span>
                <div className="h-px flex-1 bg-slate-300" />
              </motion.div>

              {/* GOOGLE BUTTON */}
              <motion.div
                variants={itemVariants}
                className="relative h-[50px] w-full overflow-hidden rounded-md"
              >
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center gap-3 rounded-md border border-slate-300 bg-white text-[15px] font-medium text-slate-800">
                  <span className="bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 bg-clip-text text-[21px] font-bold leading-none text-transparent">
                    G
                  </span>
                  <span>{t("signup.google")}</span>
                </div>

                <div className="relative z-10 h-full w-full opacity-0">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    width="100%"
                    text="continue_with"
                    shape="rectangular"
                    theme="outline"
                    size="large"
                  />
                </div>
              </motion.div>

              {/* LOGIN LINK */}
              <motion.p
                variants={itemVariants}
                className="mt-6 text-center text-[14px] text-slate-600"
              >
                {t("signup.haveAccount")}{" "}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  {t("signup.loginLink")}
                </Link>
              </motion.p>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Signup;
