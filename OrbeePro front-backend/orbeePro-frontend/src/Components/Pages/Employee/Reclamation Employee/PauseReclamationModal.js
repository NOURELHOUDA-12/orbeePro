
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./reclamation.module.css";


const PauseReclamationModal = ({ isOpen, onClose, onSubmit, task }) => {
  
  const [reason, setReason] = useState("");
  if (!isOpen || !task) return null;

const handleSubmit = () => {
  if (reason.trim()) {
    // On envoie la tâche ET la raison saisie au composant parent
    onSubmit(task, reason.trim()); 
    
    // On nettoie le champ pour la prochaine fois
    setReason(""); 
    
    // On ferme la modale
    onClose();
  }
};

  return createPortal(
    <div className="task-quickview-overlay" onClick={onClose}>
      <div
        className="task-quickview"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px" }}
      >
        <div className="task-quickview-header">
          <h3 className="task-quickview-title">
            Mettre en pause : {task.problem || task.description}
          </h3>
          <button className="task-quickview-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="task-quickview-content">
          <label
            htmlFor="pauseReason"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "600",
              color: "#1a202c",
            }}
          >
            Motif de la pause (obligatoire) :
          </label>
          <textarea
            id="pauseReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%",
              minHeight: "100px",
              borderRadius: "8px",
              padding: "0.75rem",
              border: "1px solid #e2e8f0",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
            placeholder="Ex: Pause déjeuner, attente de matériel, urgence..."
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!reason.trim()}
          className={styles.actionButton}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "white",
            opacity: !reason.trim() ? 0.5 : 1,
          }}
        >
          Confirmer la pause
        </button>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};


export default PauseReclamationModal;