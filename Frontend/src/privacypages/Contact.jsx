import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Send } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const Contact = () => {
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

    toast.success("Your message has been prepared.");

    setFormData({
      name: "",
      email: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-slate-950">
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
            <ArrowLeft size={16} />
            Back Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              Contact Support
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Have a question about CompStore ERP? Send us a message and our
              support team will help you.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 text-blue-700" size={20} />

                <div>
                  <h2 className="font-semibold text-slate-950">Email</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    support@compstoreerp.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-1 text-blue-700" size={20} />

                <div>
                  <h2 className="font-semibold text-slate-950">Location</h2>
                  <p className="mt-1 text-sm text-slate-600">Afghanistan</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Your Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter your name"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-800">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="you@example.com"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-800">
                Message
              </label>

              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Write your message..."
              />
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Send Message
              <Send size={16} />
            </button>
          </motion.form>
        </div>
      </main>
    </div>
  );
};

export default Contact;
