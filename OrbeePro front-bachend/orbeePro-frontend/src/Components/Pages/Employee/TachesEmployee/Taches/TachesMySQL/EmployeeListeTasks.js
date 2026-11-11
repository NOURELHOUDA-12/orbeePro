import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle,X, Clock, AlertCircle, MapPin, History,Calendar as CalendarIcon } from "lucide-react";

import { taskService } from "../../../../../../services/taskService";

const EmployeeListeTasks = ({ tasks, onActionSuccess }) => {
  
const [selectedHistory, setSelectedHistory] = useState(null);
const [showModal, setShowModal] = useState(false); 




  // Fonction pour formater le temps (secondes -> HH:MM:SS)
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  // --- ACTIONS ---

  const handleStart = async (taskId) => {
    const result = await taskService.updateStatus(taskId, 'in-progress');
    if (result.success) onActionSuccess();
  };

  const handlePause = async (taskId) => {
    const reason = window.prompt("Motif de la pause (ex: Pause déjeuner, Manque de matériel...) :");
    if (reason === null) return; // Annulation
    if (reason.trim() === "") return alert("Un motif est requis pour mettre en pause.");

    const result = await taskService.pause(taskId, reason);
    if (result.success) onActionSuccess();
    else alert("Erreur lors de la pause");
  };

const handleResume = async (taskId) => {
    const result = await taskService.resume(taskId);
    if (result.success) {
        onActionSuccess(); // Recharge la liste pour voir le changement de statut
    } else {
        alert("Erreur lors de la reprise de la mission.");
    }
};


  const handleComplete = async (taskId) => {
    if (window.confirm("Voulez-vous marquer cette mission comme terminée ?")) {
      const result = await taskService.updateStatus(taskId, 'completed');
      if (result.success) 
      onActionSuccess();
    }
  };


const handleShowHistory = async (taskId) => {
    const result = await taskService.getHistory(taskId);
    if (result.success) {
        setSelectedHistory(result.history);
        setShowModal(true);
    } else {
        alert("Erreur lors de la récupération de l'historique.");
    }
};


const formatDuration = (start, end) => {
    if (!end) return "En cours...";
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInMs = endDate - startDate;
    
    const diffInSecs = Math.floor(diffInMs / 1000);
    const minutes = Math.floor(diffInSecs / 60);
    const seconds = diffInSecs % 60;

    if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return `${hours}h ${remainingMins}m`;
    }
    
    return `${minutes}m ${seconds}s`;
};



  // Composant interne pour le Chronomètre dynamique
  const LiveTimer = ({ status }) => {
    const [seconds, setSeconds] = useState(0);
    
    useEffect(() => {
      let interval = null;
      if (status === 'in-progress') {
        interval = setInterval(() => setSeconds(s => s + 1), 1000);
      }
      return () => clearInterval(interval);
    }, [status]);

    return (
      <div className={`timer-display ${status === 'in-progress' ? 'active' : ''}`}>
        <Clock size={16} />
        <span>{formatTime(seconds)}</span>
      </div>
    );
  };

  return (
    <div className="tasks-grid">
      {tasks.length === 0 ? (
        <div className="no-tasks">Aucune mission trouvée.</div>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className={`task-card status-${task.status}`}>
            <div className="task-header">
              <span className={`status-badge ${task.status}`}>
                {task.status === 'pending' && 'En attente'}
                {task.status === 'in-progress' && 'En cours'}
                {task.status === 'paused' && 'En pause'}
                {task.status === 'completed' && 'Terminé'}
              </span>
             
             {task.status === 'paused' && (
               <button 
            onClick={() => handleShowHistory(task.id)} 
            className="btn-history" 
            title="Voir l'historique"
        >
            <History size={16} />
        </button>

             )}
              <LiveTimer status={task.status} />
            </div>

            <div className="task-body">
              <h3 className="task-title">{task.taskType}</h3>
              
              <div className="task-info">
                <div className="info-item">
                  <MapPin size={14} />
                  <span>{task.espaceNom || 'Zone non définie'}</span>
                </div>
                <div className="info-item">
                  <CalendarIcon size={14} />
                  <span>{new Date(task.date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {task.notes && (
                <div className="task-notes">
                  <AlertCircle size={14} />
                  <p>{task.notes}</p>
                </div>
              )}
            </div>

            <div className="task-actions">
              {/* BOUTON DÉMARRER */}
              {task.status === 'pending' && (
                <button onClick={() => handleStart(task.id)} className="btn-start">
                  <Play size={18} /> Démarrer la mission
                </button>
              )}

              {/* BOUTONS EN COURS */}
              {task.status === 'in-progress' && (
                <>
                  <button onClick={() => handlePause(task.id)} className="btn-pause">
                    <Pause size={18} /> Pause
                  </button>
                  <button onClick={() => handleComplete(task.id)} className="btn-complete">
                    <CheckCircle size={18} /> Terminer
                  </button>
                </>
              )}

              {/* BOUTON REPRENDRE */}
              {task.status === 'paused' && (
                <button onClick={() => handleResume(task.id)} className="btn-resume">
                  <Play size={18} /> Reprendre la mission
                </button>
              )}

              {/* ÉTAT TERMINÉ */}
              {task.status === 'completed' && (
                <div className="completed-label">
                  <CheckCircle size={18} color="#10b981" /> Mission effectuée
                </div>
              )}
            </div>


            
          </div>
        ))
      )}



{showModal && (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <div className="header-title">
                    <Clock size={20} className="text-amber-500" />
                    <h3>Historique des Pauses</h3>
                </div>
                <button className="close-btn" onClick={() => setShowModal(false)}>
                    <X size={24} />
                </button>
            </div>
            
            <div className="modal-body">
                {selectedHistory.length > 0 ? (
                    <div className="table-container">
                       <table className="history-table">
    <thead>
        <tr>
            <th>Date</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Durée</th> {/* Nouvelle colonne */}
            <th>Raison</th>
        </tr>
    </thead>
    <tbody>
        {selectedHistory.map((h, index) => (
            <tr key={index}>
                <td className="font-bold">{new Date(h.pauseStart).toLocaleDateString('fr-FR')}</td>
                <td className="text-mono">{new Date(h.pauseStart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="text-mono">
                    {h.pauseEnd 
                        ? new Date(h.pauseEnd).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) 
                        : <span className="status-live">En cours</span>}
                </td>
                <td className="duration-cell">
                    {formatDuration(h.pauseStart, h.pauseEnd)}
                </td>
                <td className="reason-cell">{h.reason || "Non renseigné"}</td>
            </tr>
        ))}
    </tbody>
</table>
                    </div>
                ) : (
                    <div className="empty-history">
                        <p>Aucune pause enregistrée pour cette mission.</p>
                    </div>
                )}
            </div>
            <div className="modal-footer">
                {/* <button className="btn-close-footer" onClick={() => setShowModal(false)}>
                    Fermer
                </button> */}
            </div>
        </div>
    </div>
)}







    
    </div>
  );
};

export default EmployeeListeTasks;