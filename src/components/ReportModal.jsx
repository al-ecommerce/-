import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createReport } from "../firebase/db";
import { Modal, Button, Alert, FormSelect, FormTextarea } from "./UI";
import { toast } from "./UI";

const REASONS = ["Scam/Fraud", "Misleading listing", "Inappropriate content", "Wrong category", "Spam", "Fake product/service", "Harassment", "Other"];

export const ReportModal = ({ isOpen, onClose, targetId, targetType }) => {
  const { currentUser, userDoc } = useAuth();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!currentUser) return toast.error("Please login to report");
    setLoading(true);
    try {
      await createReport({
        targetId, targetType, reason, details,
        reporterId: currentUser.uid,
        reporterName: userDoc?.displayName || "Anonymous"
      });
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 2000);
    } catch (e) { toast.error("Failed to submit report"); }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report ${targetType}`}
      footer={!done && (
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={handleSubmit}>Submit Report</Button>
        </>
      )}
    >
      {done ? (
        <Alert type="success">Report submitted. Our team will review it.</Alert>
      ) : (
        <>
          <Alert type="warning">Reports help keep AlEcom safe. False reports may result in account action.</Alert>
          <FormSelect label="Reason" value={reason} onChange={e => setReason(e.target.value)}>
            {REASONS.map(r => <option key={r}>{r}</option>)}
          </FormSelect>
          <FormTextarea label="Additional Details" value={details} onChange={e => setDetails(e.target.value)}
            placeholder="Provide more context..." rows={3} />
        </>
      )}
    </Modal>
  );
};
