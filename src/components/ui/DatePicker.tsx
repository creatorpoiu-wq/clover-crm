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
        className={className || "input"}
        placeholderText={isLoading ? "Loading availability..." : placeholder}
        required={required}
        disabled={isLoading}
        dateFormat="MMMM d, yyyy"
        minDate={new Date()} // Prevent booking in the past
      />
      <style jsx global>{`
        .custom-datepicker-wrapper .react-datepicker-wrapper {
          width: 100%;
        }
        .custom-datepicker-wrapper .react-datepicker__input-container input {
          width: 100%;
          ${style ? Object.entries(style).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v};`).join('\n') : ''}
        }
      `}</style>
    </div>
  );
}
