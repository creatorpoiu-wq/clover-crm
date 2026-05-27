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

  const renderCalendarDays = () => {
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
      const isAvailable = !isPast && !isBooked && dateObj.getDay() !== 0 && dateObj.getDay() !== 6;
      const isSelected = selectedDate === dateStr;

      days.push(
        <button
          key={d}
          disabled={!isAvailable}
          onClick={() => onSelect(dateStr, '')}
          className={isSelected ? 'btn btn-primary' : isAvailable ? 'btn btn-secondary' : ''}
          style={{
            height: '3rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s',
            ...(isSelected ? { backgroundColor: themeColor, color: 'white', border: 'none' } : isAvailable ? { backgroundColor: 'white', color: '#334155', border: '1px solid #e2e8f0' } : { backgroundColor: '#f8fafc', color: '#cbd5e1', cursor: 'not-allowed', border: '1px solid transparent' })
          }}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="glass-panel funnel-pad">
      <h2 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>Select a Date & Time</h2>
      <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>Choose an available slot from our calendar.</p>

      <div className="funnel-grid funnel-grid-2">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handlePrevMonth} style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', backgroundColor: 'transparent', cursor: 'pointer', color: '#475569' }}><ChevronLeft size={18} /></button>
              <button onClick={handleNextMonth} style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', backgroundColor: 'transparent', cursor: 'pointer', color: '#475569' }}><ChevronRight size={18} /></button>
            </div>
          </div>
          
          <div className="funnel-grid funnel-grid-7" style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
            {weekDays.map(wd => <div key={wd}>{wd}</div>)}
          </div>
          
          <div className="funnel-grid funnel-grid-7">
            {renderCalendarDays()}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#94a3b8" />
            {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date first'}
          </h3>
          
          {selectedDate ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => onSelect(selectedDate, time)}
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 700, transition: 'all 0.2s', cursor: 'pointer',
                    ...(selectedTime === time ? { backgroundColor: themeColor, color: 'white', border: '1px solid transparent' } : { backgroundColor: 'white', color: '#334155', border: '1px solid #e2e8f0' })
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ height: '100%', minHeight: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', borderRadius: '1rem', backgroundColor: '#f8fafc', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
              Awaiting date selection
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onNext}
          disabled={!selectedDate || !selectedTime}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', transition: 'all 0.2s', opacity: (!selectedDate || !selectedTime) ? 0.5 : 1, cursor: (!selectedDate || !selectedTime) ? 'not-allowed' : 'pointer', backgroundColor: themeColor, border: 'none' }}
        >
          Confirm Date <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
