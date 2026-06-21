import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";

interface PayPalCheckoutButtonProps {
  clientId: string;
  amount: number;
  description?: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

export default function PayPalCheckoutButton({ clientId, amount, description, onSuccess, onError }: PayPalCheckoutButtonProps) {
  const [isPending, setIsPending] = useState(true);

  if (!clientId) return null;

  return (
    <PayPalScriptProvider options={{ clientId: clientId, currency: "USD", intent: "capture" }}>
      <div style={{ position: 'relative', minHeight: 150, zIndex: 1 }}>
        {isPending && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#64748b', fontSize: '0.875rem' }}>Loading PayPal securely...</div>}
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "pay" }}
          onInit={() => setIsPending(false)}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  description: description || "Invoice Payment",
                  amount: {
                    currency_code: "USD",
                    value: amount.toFixed(2),
                  },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            if (!actions.order) return;
            try {
              const details = await actions.order.capture();
              onSuccess(details);
            } catch (err) {
              onError(err);
            }
          }}
          onError={(err) => {
            onError(err);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
