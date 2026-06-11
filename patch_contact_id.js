const fs = require('fs');
const path = 'src/app/dashboard/contacts/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for Log Communication Modal
const stateVars = `
  const [showLogCommModal, setShowLogCommModal] = useState(false);
  const [commInquiryId, setCommInquiryId] = useState("");
  const [commDate, setCommDate] = useState(new Date().toISOString().slice(0, 16));
  const [commBy, setCommBy] = useState("Me");
  const [commMessage, setCommMessage] = useState("");
  const [commLoading, setCommLoading] = useState(false);
`;
content = content.replace(/const \[isSaving, setIsSaving\] = useState\(false\);\n/, `const [isSaving, setIsSaving] = useState(false);\n${stateVars}`);

// 2. Add handleLogComm function
const handleLogComm = `
  const handleLogComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commInquiryId) {
       alert("Please select an inquiry");
       return;
    }
    setCommLoading(true);
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: parseInt(commInquiryId),
          contactDate: commDate.replace("T", " ") + ":00",
          contactBy: commBy,
          message: commMessage
        })
      });
      if (res.ok) {
        setShowLogCommModal(false);
        setCommMessage("");
        fetchContactData();
      } else {
        alert("Failed to log communication.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommLoading(false);
    }
  };
`;
content = content.replace(/const handleCreateSession = async \(\) => \{/, `${handleLogComm}\n\n  const handleCreateSession = async () => {`);

// 3. Change button in Communications tab
content = content.replace(/<button onClick=\{\(\) => setIsNoteModalOpen\(true\)\}.*?>Log Manual Note<\/button>/, `<button onClick={() => setShowLogCommModal(true)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Log Communication</button>`);

// 4. Add the Log Communication Modal JSX at the end, right before the closing </div></>
const modalJsx = `
      {/* Log Communication Modal */}
      {showLogCommModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Log Communication</h3>
            <form onSubmit={handleLogComm} className="space-y-4">
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Select Project / Inquiry *</label>
                <select 
                  className="input" 
                  value={commInquiryId}
                  onChange={(e) => setCommInquiryId(e.target.value)}
                  required
                >
                  <option value="">-- Choose an active project --</option>
                  {inquiries.map((inq) => (
                    <option key={inq.Inquiry_ID} value={inq.Inquiry_ID}>
                      {inq.Service_Type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="input" 
                    value={commDate}
                    onChange={(e) => setCommDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Who initiated? *</label>
                  <select 
                    className="input" 
                    value={commBy}
                    onChange={(e) => setCommBy(e.target.value)}
                    required
                  >
                    <option value="Me">Me (I reached out to them)</option>
                    <option value="Client">Client (They reached out to me)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Message / Notes</label>
                <textarea 
                  className="input" 
                  style={{ minHeight: "100px", resize: "vertical" }} 
                  placeholder="Record what was discussed or sent..." 
                  value={commMessage}
                  onChange={(e) => setCommMessage(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowLogCommModal(false)} style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={commLoading} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.25rem', fontWeight: 600, cursor: 'pointer' }}>
                  {commLoading ? 'Saving...' : 'Log Communication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(/(<\/div>\n    <\/div>\n  \);\n\}$)/, `${modalJsx}\n$1`);

// Wait, the actual end of the file is:
/*
      {/* Contract Builder Modal *\/}
      {showContractBuilder && typeof window !== 'undefined' && createPortal(
...
      )}
    </>
  );
}
*/
content = content.replace(/(    <\/>\n  \);\n\}$)/, `${modalJsx}\n$1`);

fs.writeFileSync(path, content);
console.log('Done modifying contacts/[id]/page.tsx');
