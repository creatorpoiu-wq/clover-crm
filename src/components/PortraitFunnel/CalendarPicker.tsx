import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, ArrowRight } from 'lucide-react';

interface CalendarPickerProps {
  bookedDates: string[];
  selectedDate: string | null;
  selectedTime: string | null;
  onSelect: (date: string, time: string) => void;
  onNext: () => void;
  themeColor: string;
}

export default function CalendarPicker({ 
  bookedDates, selectedDate, selectedTime, onSelect, onNext, themeColor 
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Available time slots (hardcoded for MVP based on user prompt 'use calendar availability')
  // We'll generate 9 AM to 4 PM slots
  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-12 w-full"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const isPast = dateObj < today;
    const isBooked = bookedDates.includes(dateStr);
    const isAvailable = !isPast && !isBooked && dateObj.getDay() !== 0 && dateObj.getDay() !== 6; // Weekdays only for demo
    const isSelected = selectedDate === dateStr;

    days.push(
      <button
        key={d}
        disabled={!isAvailable}
        onClick={() => {
          onSelect(dateStr, ''); // Reset time when date changes
        }}
        className={`h-12 w-full flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
          isSelected 
            ? 'text-white shadow-md transform scale-105' 
            : isAvailable 
              ? 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm border border-slate-200 hover:border-slate-300' 
              : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
        }`}
        style={isSelected ? { backgroundColor: themeColor } : {}}
      >
        {d}
      </button>
    );
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
      <h2 className="text-3xl font-black text-slate-800 mb-2">Select a Date & Time</h2>
      <p className="text-slate-500 mb-10">Choose an available slot from our calendar.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Calendar Side */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"><ChevronLeft size={18} /></button>
              <button onClick={handleNextMonth} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"><ChevronRight size={18} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            {weekDays.map(wd => <div key={wd}>{wd}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days}
          </div>
        </div>

        {/* Time Slots Side */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date first'}
          </h3>
          
          {selectedDate ? (
            <div className="grid grid-cols-2 gap-3">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => onSelect(selectedDate, time)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                    selectedTime === time
                      ? 'text-white border-transparent shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  style={selectedTime === time ? { backgroundColor: themeColor } : {}}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 text-sm font-medium">
              Awaiting date selection
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
        <button
          onClick={onNext}
          disabled={!selectedDate || !selectedTime}
          className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold tracking-wide uppercase transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: themeColor }}
        >
          Confirm Date <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
