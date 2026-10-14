import React, { useEffect, useState } from "react";
import * as jalaali from "jalaali-js";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

const MONTHS = [
  "حمل",
  "ثور",
  "جوزا",
  "سرطان",
  "اسد",
  "سنبله",
  "میزان",
  "عقرب",
  "قوس",
  "جدی",
  "دلو",
  "حوت",
];

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const toISODate = (jy, jm, jd) => {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
};

const today = () => {
  const now = new Date();
  return jalaali.toJalaali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
};

const getShamsiDate = (value) => {
  if (!value) return null;

  const match = String(value)
    .slice(0, 10)
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  return jalaali.toJalaali(year, month, day);
};

export default function ShamsiDatePicker({
  value = "",
  onChange,
  placeholder = "انتخاب تاریخ",
  className = "",
  clearable = true,
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => getShamsiDate(value) || today());

  useEffect(() => {
    const selected = getShamsiDate(value);
    if (selected) {
      setView(selected);
    }
  }, [value]);

  const selected = getShamsiDate(value);
  const daysInMonth = jalaali.jalaaliMonthLength(view.jy, view.jm);

  const firstDayISO = toISODate(view.jy, view.jm, 1);
  const [gy, gm, gd] = firstDayISO.split("-").map(Number);
  const firstWeekday = (new Date(gy, gm - 1, gd).getDay() + 1) % 7;

  const previousMonth = () => {
    setView((current) =>
      current.jm === 1
        ? { jy: current.jy - 1, jm: 12, jd: 1 }
        : { ...current, jm: current.jm - 1, jd: 1 },
    );
  };

  const nextMonth = () => {
    setView((current) =>
      current.jm === 12
        ? { jy: current.jy + 1, jm: 1, jd: 1 }
        : { ...current, jm: current.jm + 1, jd: 1 },
    );
  };

  const chooseDate = (day) => {
    onChange?.(toISODate(view.jy, view.jm, day));
    setOpen(false);
  };

  const displayValue = selected
    ? `${selected.jy}/${String(selected.jm).padStart(2, "0")}/${String(
        selected.jd,
      ).padStart(2, "0")}`
    : "";

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div className="relative">
        <CalendarDays
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pl-10 text-left text-sm text-slate-700 outline-none transition hover:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {displayValue || (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </button>

        {clearable && value && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => onChange?.("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close calendar"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            dir="rtl"
            className="absolute left-0 top-full z-50 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={previousMonth}
                aria-label="Previous month"
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <ChevronRight size={18} />
              </button>

              <div className="text-center">
                <p className="font-bold text-slate-900">
                  {MONTHS[view.jm - 1]} {view.jy}
                </p>
                <p className="mt-1 text-xs text-slate-500">تقویم هجری شمسی</p>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  className="py-2 text-xs font-semibold text-slate-500"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: firstWeekday }, (_, index) => (
                <div key={`empty-${index}`} />
              ))}

              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const isSelected =
                  selected?.jy === view.jy &&
                  selected?.jm === view.jm &&
                  selected?.jd === day;

                const isToday = (() => {
                  const current = today();
                  return (
                    current.jy === view.jy &&
                    current.jm === view.jm &&
                    current.jd === day
                  );
                })();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => chooseDate(day)}
                    className={`flex h-9 items-center justify-center rounded-lg text-sm transition ${
                      isSelected
                        ? "bg-blue-600 font-bold text-white"
                        : isToday
                          ? "border border-blue-500 font-semibold text-blue-700 hover:bg-blue-50"
                          : "text-slate-700 hover:bg-blue-50"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  const current = today();
                  onChange?.(toISODate(current.jy, current.jm, current.jd));
                  setView(current);
                  setOpen(false);
                }}
                className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                امروز
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                بستن
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
