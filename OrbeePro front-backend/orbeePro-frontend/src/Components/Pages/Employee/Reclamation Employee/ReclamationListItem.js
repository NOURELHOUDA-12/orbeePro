import React, { useState, useEffect, useMemo } from "react";
import { 
  AlertCircle, CheckCircle, Clock, ChevronDown, 
  User, PauseCircle, MapPin, ImageIcon ,Play,       
  RefreshCw,
} from "lucide-react";
import styles from "./reclamation.module.css";
import { API_URL, UPLOADS_URL } from "../../../../constants";

const ReclamationListItem = ({
  item,
  filter,
  getLocationNameById,
  handleUpdateStatus, // Pour "Commencer" et "Terminer"
  handleOpenPauseModal, // Pour ouvrir la modale de saisie de raison
  handleResumeTask // Nouvelle fonction pour appeler l'API de reprise
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  // --- LOGIQUE DU COMPTEUR DE TEMPS RÉEL ---
  useEffect(() => {
    let interval;
    
    if (item.status === 'en cours' && item.startedAt) {
      interval = setInterval(() => {
        const start = new Date(item.startedAt).getTime();
        let now = new Date().getTime();
        
        // Calcul du temps total écoulé depuis le début
        let totalMs = now - start;

        // Soustraction de la durée de toutes les pauses passées
        if (item.pauses && item.pauses.length > 0) {
          item.pauses.forEach(p => {
            const pStart = new Date(p.pausedAt).getTime();
            const pEnd = p.resumedAt ? new Date(p.resumedAt).getTime() : now;
            totalMs -= (pEnd - pStart);
          });
        }

        const hours = Math.floor(totalMs / 3600000);
        const minutes = Math.floor((totalMs % 3600000) / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);

        setElapsedTime(
          `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`
        );
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [item.status, item.startedAt, item.pauses]);

  const toggleItemExpansion = () => setIsExpanded((prev) => !prev);

  // Déterminer la classe de statut pour le style
  const getStatusClass = (status) => {
    switch (status) {
      case 'résolu': return styles.statusCompleted;
      case 'en cours': return styles.statusInProgress;
      case 'paused': return styles.statusPaused;
      default: return styles.statusPending;
    }
  };

  const imageArray = Array.isArray(item.photoURL) ? item.photoURL : [item.photoURL];

  return (
    <div className={styles.reclamationItemWrapper}>
      <div className={`${styles.reclamationItem} ${isExpanded ? styles.reclamationItemExpanded : ""}`} onClick={toggleItemExpansion}>
        
        <div className={styles.reclamationContent}>
          <div className={styles.reclamationTitle}>
            <h3 className={styles.reclamationProblem}>{item.description || item.problem}</h3>
            {item.status === 'en cours' && (
              <span className={styles.timerBadge}>
                <Clock size={12} /> {elapsedTime || "Démarrage..."}
              </span>
            )}
          </div>
          
          <div className={styles.reclamationMeta}>
            <div className={styles.reclamationDetail}>
              <MapPin size={14} />
              <span>{item.espaceNumber}</span>
            </div>
            <div className={styles.reclamationDetail}>
              <User size={14} />
              <span>Agent: <strong>{item.agentName || "Non assigné"}</strong></span>
            </div>
          </div>
        </div>

        <div className={styles.reclamationStatusSection}>
          <div className={`${styles.reclamationStatus} ${getStatusClass(item.status)}`}>
            {item.status === 'paused' ? <PauseCircle size={14} /> : <AlertCircle size={14} />}
            {item.status.toUpperCase()}
          </div>
          <button className={`${styles.expandBtn} ${isExpanded ? styles.expandBtnRotated : ""}`}>
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.reclamationExpanded}>
          <div className={styles.expandedMainContent}>
            <div className={styles.expandedColumnLeft}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Priorité:</span>
                <span className={styles.detailValue}>{item.urgency || "Normal"}</span>
              </div>
              {item.status === 'paused' && (
                <div className={styles.currentPauseBanner}>
                   <strong>Motif de pause:</strong> {item.currentPauseReason || "Non spécifié"}
                </div>
              )}
            </div>

            <div className={styles.expandedColumnRight}>
              {item.photoURL && (
                <div className={styles.imagesCompact}>
                  {imageArray.map((url, idx) => (
                    <img key={idx} src={`${UPLOADS_URL}/reclamations/${url}`} className={styles.imageCompact} alt="Preuve" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* --- SECTION ACTIONS DYNAMIQUES --- */}
          {filter === "pending" && (
            <div className={styles.reclamationActions} onClick={(e) => e.stopPropagation()}>
  
  {/* CAS 1 : La tâche n'a pas encore commencé */}
  {(item.status === 'en attente' || item.status === 'pending') && (
    <button 
      onClick={() => handleUpdateStatus(item, 'en cours')} 
      className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
    >
      <Play size={18} /> Commencer la réalisation
    </button>
  )}

  {/* CAS 2 : La tâche est en cours (On affiche Terminer ET Pause) */}
  {item.status === 'en cours' && (
    <>
      <button 
        onClick={() => handleUpdateStatus(item, 'résolu')} 
        className={`${styles.actionButton} ${styles.actionButtonSuccess}`}
      >
        <CheckCircle size={18} /> Terminer
      </button>
      
      <button 
        onClick={() => handleOpenPauseModal(item)} // Ouvre la modale pour la raison
        className={`${styles.actionButton} ${styles.actionButtonWarning}`}
      >
        <PauseCircle size={18} /> Mettre en pause
      </button>
    </>
  )}

  {/* CAS 3 : La tâche est déjà en pause (On affiche seulement Reprendre) */}
  {item.status === 'paused' && (
    <button 
      onClick={() => handleUpdateStatus(item, 'en cours')} 
      className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
    >
      <RefreshCw size={18} /> Reprendre le travail
    </button>
  )}
</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReclamationListItem;