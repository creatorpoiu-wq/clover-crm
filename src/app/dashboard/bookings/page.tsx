"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Clock, DollarSign, FileText, CheckCircle, XCircle, Mail, Phone, Package, MoreVertical, X } from "lucide-react";
import Link from "next/link";

function BookingsDashboardContent() {
  const searchParams = useSearchParams();
  const initialBookingId = searchParams.get("bookingId");

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/session-bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
        if (initialBookingId) {
          const found = (data.bookings || []).find((b: any) => b.Booking_ID.toString() === initialBookingId);
          if (found) setSelectedBooking(found);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [initialBookingId]);

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const res = await fetch("/api/session-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.Booking_ID === bookingId ? { ...b, Status: newStatus } : b));
        if (selectedBooking?.Booking_ID === bookingId) {
          setSelectedBooking({ ...selectedBooking, Status: newStatus });
        }
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status.");
    }
  };

  const filteredBookings = statusFilter === "All" 
    ? bookings 
    : bookings.filter(b => b.Status === statusFilter);

  const stats = {
    all: bookings.length,
    pending: bookings.filter(b => b.Status === "Pending").length,
    confirmed: bookings.filter(b => b.Status === "Approved").length,
    declined: bookings.filter(b => b.Status === "Declined").length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Booking Submissions</h1>
          <p className="text-slate-500">Track and manage all your session booking requests.</p>
        </div>
      </div>

      {/* Tabs — pill segment control */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl mb-6 w-fit border border-slate-200/70 shadow-sm">
        {[
          { id: "All",      label: "All",       count: stats.all,       dot: null },
          { id: "Pending",  label: "Pending",   count: stats.pending,   dot: "bg-amber-400" },
          { id: "Approved", label: "Confirmed", count: stats.confirmed, dot: "bg-emerald-400" },
          { id: "Declined", label: "Declined",  count: stats.declined,  dot: "bg-red-400" },
        ].map(({ id, label, count, dot }) => (
          <button
            key={id}
            onClick={() => setStatusFilter(id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              statusFilter === id
                ? "bg-white text-slate-900 shadow-md shadow-slate-200/70 border border-slate-200/60"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            {dot && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot} ${
                statusFilter === id ? "opacity-100" : "opacity-60"
              }`} />
            )}
            {label}
            <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center leading-none transition-colors ${
              statusFilter === id
                ? id === "Pending"  ? "bg-amber-100 text-amber-700"
                : id === "Approved" ? "bg-emerald-100 text-emerald-700"
                : id === "Declined" ? "bg-red-100 text-red-700"
                : "bg-slate-200 text-slate-700"
                : "bg-slate-200/60 text-slate-500"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No bookings found</h3>
          <p className="text-slate-500">You don't have any bookings matching this filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Session</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b.Booking_ID} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{b.Client_Name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{b.Client_Email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{b.Sessions?.Session_Type || "Custom Session"}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{b.Sessions?.Service_Type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(b.Booked_Date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.Booked_Time}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      b.Status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      b.Status === "Declined" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {b.Status === "Approved" ? "Confirmed" : b.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedBooking(b)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-emerald-100"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  {selectedBooking.Client_Name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedBooking.Client_Name}</h2>
                  <p className="text-sm text-slate-500">Booking #{selectedBooking.Booking_ID}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Session Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{selectedBooking.Sessions?.Session_Type || "Session"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{new Date(selectedBooking.Booked_Date + 'T00:00:00').toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{selectedBooking.Booked_Time}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${selectedBooking.Client_Email}`} className="text-emerald-600 hover:underline">{selectedBooking.Client_Email}</a>
                    </div>
                    {selectedBooking.Client_Phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{selectedBooking.Client_Phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedBooking.Notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Client Notes</h3>
                  <div className="bg-amber-50/50 p-4 rounded-xl text-sm text-slate-700 border border-amber-100 italic">
                    "{selectedBooking.Notes}"
                  </div>
                </div>
              )}

              {/* Status Section */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                    selectedBooking.Status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    selectedBooking.Status === "Declined" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {selectedBooking.Status === "Approved" ? "Confirmed" : selectedBooking.Status}
                  </span>
                </div>

                {selectedBooking.Status === "Pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.Booking_ID, "Declined")}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Decline
                    </button>
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.Booking_ID, "Approved")}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirm Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading bookings...</div>}>
      <BookingsDashboardContent />
    </Suspense>
  );
}
