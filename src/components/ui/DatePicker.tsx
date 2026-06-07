"use client";

import React, { useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { parseISO } from 'date-fns';

interface DatePickerProps {
  value: string | Date;
  onChange: (val: string) => void;
  userId?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

export function DatePicker({ value, onChange, userId, className, placeholder = "Select a date", required, style }: DatePickerProps) {
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const fetchBlockedDates = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/availability?userId=${userId}`);
        const data = await res.json();
        if (data.success && data.blockedDates && isMounted) {
          const dates = data.blockedDates.map((dateStr: string) => {
            // Need to ensure the date is parsed in the local timezone so the calendar highlights the correct box.
            // Split YYYY-MM-DD and create a date at noon to avoid timezone shift issues
            const [y, m, d] = dateStr.split('-');
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
          });
          setBlockedDates(dates);
        }
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBlockedDates();
    
    return () => { isMounted = false; };
  }, [userId]);

  // Convert string value to Date object for react-datepicker
  const selectedDate = value ? (typeof value === 'string' ? new Date(value + 'T12:00:00') : value) : null;

  return (
    <div className="custom-datepicker-wrapper" style={{ width: '100%', position: 'relative' }}>
      <ReactDatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (date) {
            // Convert back to YYYY-MM-DD local string
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            onChange(localDate.toISOString().split('T')[0]);
          } else {
            onChange('');
          }
        }}
        excludeDates={blockedDates}
        customInput={<input style={{ textAlign: 'left', ...(style || {}) }} className={className || "input"} />}
        placeholderText={isLoading ? "Loading availability..." : placeholder}
        required={required}
        disabled={isLoading}
        dateFormat="MMMM d, yyyy"
        minDate={new Date()} // Prevent booking in the past
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        popperPlacement="bottom-start"
        popperModifiers={[
          {
            name: "flip",
            options: { fallbackPlacements: ["bottom"] },
          },
          {
            name: "preventOverflow",
            options: { rootBoundary: "document" },
          }
        ] as any}
        onCalendarOpen={() => {
          setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
          setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
        }}
        onCalendarClose={() => {
          setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
        }}
      />
      <style jsx global>{`
        .custom-datepicker-wrapper .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          font-size: 1.15rem;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          background-color: #ffffff;
        }
        .react-datepicker__header {
          background-color: transparent;
          border-bottom: none;
          padding-top: 0.5rem;
        }
        .react-datepicker__header select {
          padding: 6px 24px 6px 12px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-family: inherit;
          font-weight: 600;
          font-size: 1.1rem;
          color: #0f172a;
          background-color: #f8fafc;
          margin: 0 4px;
          cursor: pointer;
        }
        .react-datepicker__current-month {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.75rem;
        }
        .react-datepicker__day-name {
          color: #64748b;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .react-datepicker__day-name, .react-datepicker__day {
          width: 3rem;
          line-height: 3rem;
          margin: 0.25rem;
          border-radius: 8px;
        }
        .react-datepicker__day:hover {
          background-color: #f1f5f9;
        }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
          background-color: #0f172a !important;
          color: white !important;
          font-weight: 600;
        }
        .react-datepicker__navigation {
          top: 24px;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #64748b;
          border-width: 2px 2px 0 0;
          height: 10px;
          width: 10px;
        }
        .react-datepicker__navigation:hover *::before {
          border-color: #0f172a;
        }
      `}</style>
    </div>
  );
}
