"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ContractBuilder from "@/components/ContractBuilder";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import NewContactInquiryForm from "@/components/NewContactInquiryForm";
import NewQuestionnaireModal from "@/components/NewQuestionnaireModal";
import NewSessionBookingForm from "@/components/NewSessionBookingForm";

interface DashboardModalsProps {
  modalType: "project" | "invoice" | "contract" | "contact" | "questionnaire" | "quote" | "session" | null;
  onClose: () => void;
}

export default function DashboardModals({ modalType, onClose }: DashboardModalsProps) {
  if (!modalType) return null;

  // For Contract/Quote, we use the Builders.
  if (modalType === "contract" || modalType === "quote") {
    return createPortal(
      <ContractBuilder
        documentType={modalType === "contract" ? "Contract" : "Proposal"}
        onClose={onClose}
        onDraftSaved={onClose}
        onSave={onClose}
      />,
      document.body
    );
  }

  // Invoice
  if (modalType === "invoice") {
    return createPortal(
      <InvoiceBuilder
        onClose={onClose}
        onDraftSaved={onClose}
      />,
      document.body
    );
  }

  // Questionnaire
  if (modalType === "questionnaire") {
    return createPortal(
      <NewQuestionnaireModal
        onSuccess={() => {
          onClose();
          window.location.href = "/dashboard/questionnaire";
        }}
        onCancel={onClose}
      />,
      document.body
    );
  }

  // For Session, show the new manual booking form.
  if (modalType === "session") {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 16px' }}
        onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Create New Booking Session</h2>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><X size={18} /></button>
          </div>
          <NewSessionBookingForm 
            onSuccess={() => {
              onClose();
              window.location.href = "/dashboard/bookings";
            }} 
            onCancel={onClose} 
          />
        </div>
      </div>,
      document.body
    );
  }

  // For Project and Contact, we show a popup with NewContactInquiryForm.
  if (modalType === "project" || modalType === "contact") {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 16px' }}
        onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{modalType === "project" ? "Create New Project" : "Create New Contact"}</h2>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><X size={18} /></button>
          </div>
          <NewContactInquiryForm onSuccess={onClose} onCancel={onClose} />
        </div>
      </div>,
      document.body
    );
  }

  return null;
}
