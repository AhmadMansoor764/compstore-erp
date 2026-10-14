import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LockKeyhole, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitted(true);

    // Later you will call your backend API here.
    // Example:
    // await axios.post(`/api/auth/reset-password/${token}`, {
    //   password,
    // });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8ff] px-4 py-10">
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
      >
        <Link
          to="/login"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to login
        </Link>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <LockKeyhole size={28} />
        </div>

        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          Reset your password
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Create a new password for your account.
        </p>

        {submitted ? (
          <div className="mt-6">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <p className="text-sm leading-6 text-emerald-800">
                Your password has been reset successfully.
              </p>
            </div>

            <Link
              to="/login"
              className="mt-6 flex h-12 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Continue to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                New password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter new password"
                required
                className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm new password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                required
                className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <LockKeyhole size={18} />
              Reset password
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
