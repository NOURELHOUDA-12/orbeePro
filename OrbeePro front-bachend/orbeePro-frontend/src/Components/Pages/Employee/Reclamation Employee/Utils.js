import React from 'react';
import { CheckCircle, Clock, AlertCircle, PauseCircle } from "lucide-react";
import styles from "./reclamation.module.css";

export const PRIORITY_COLORS = {
  tres_urgent: '#DC2626',
  urgent: '#F59E0B',
  normal: '#3B82F6',
  faible: '#10B981'
};

export const STATUS_COLORS = {
  'pending': { bg: '#F3F4F6', color: '#6B7280' },
  'en attente': { bg: '#F3F4F6', color: '#6B7280' },
  'in-progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  'en cours': { bg: '#DBEAFE', color: '#1D4ED8' },
  'assigné': { bg: '#DBEAFE', color: '#1D4ED8' },
  'paused': { bg: '#FEF3C7', color: '#D97706' },
  'completed': { bg: '#D1FAE5', color: '#059669' },
  'résolu': { bg: '#D1FAE5', color: '#059669' },
  'clôturé': { bg: '#D1FAE5', color: '#059669' }
};

export const PRIORITY_ORDER = { 
  tres_urgent: 1, 
  urgent: 2, 
  normal: 3, 
  faible: 4 
};

export const getLocalDateString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getReclamationStatusText = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "résolu": return "Résolue";
    case "in-progress":
    case "en cours": return "En cours";
    case "pending":
    case "en attente": return "En attente";
    case "paused": return "En pause";
    case "assigné": return "Assigné";
    case "clôturé": return "Clôturée";
    default: return "Inconnu";
  }
};

export const getReclamationStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "résolu":
    case "clôturé":
      return <CheckCircle size={14} />;
    case "in-progress":
    case "en cours":
    case "assigné":
      return <Clock size={14} />;
    case "pending":
    case "en attente":
      return <AlertCircle size={14} />;
    case "paused":
      return <PauseCircle size={14} />;
    default:
      return <AlertCircle size={14} />;
  }
};

/**
 * Pour gérer les styles CSS modules, on passe l'objet styles du composant en paramètre
 */
export const getStatusClass = (status) => {
  const text = getReclamationStatusText(status);
  switch (text) {
    case "Résolue":
    case "Clôturée": return styles.statusCompleted;
    case "En cours":
    case "Assigné": return styles.statusInProgress;
    case "En attente": return styles.statusPending;
    case "En pause": return styles.statusPaused;
    default: return styles.statusPending;
  }
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "N/A";
  // Gestion MySQL (string) et Firebase (Timestamp object)
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getPriorityText = (priority) => {
  const priorityLabels = {
    tres_urgent: "Très Urgent",
    urgent: "Urgent",
    normal: "Normal",
    faible: "Faible",
  };
  return priorityLabels[priority] || priority;
};