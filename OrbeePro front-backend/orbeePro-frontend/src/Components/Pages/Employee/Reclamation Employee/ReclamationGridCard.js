import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  History,
  User,
  Loader,
  PauseCircle,
  MapPin,
  ImageIcon,
  List,
  Grid,
  Calendar as CalendarIcon,
} from "lucide-react";
import styles from "./reclamation.module.css";

import { getStatusClass, getReclamationStatusIcon, getReclamationStatusText, formatTimestamp, getPriorityText } from "./Utils";

const ReclamationGridCard = ({ item, getLocationNameById }) => {
  const statusClass = getStatusClass(item.status);
  const priority = item.priority || item.urgency;

  return (
    <div className={styles.reclamationGridCard}>
      <div className={styles.gridCardHeader}>
        <h3 className={styles.gridCardTitle}>
          {item.description || item.problem}
        </h3>
        <div
          className={`${styles.reclamationStatus} ${styles.statusSmall} ${statusClass}`}
        >
          {getReclamationStatusIcon(item.status)}
          {getReclamationStatusText(item.status)}
        </div>
      </div>
      <div className={styles.gridCardMeta}>
        <div className={styles.gridCardDetail}>
          <MapPin size={16} />
          <span>{getLocationNameById(item.locationId)}</span>
        </div>
        <div className={styles.gridCardDetail}>
          <Clock size={16} />
          <span>{formatTimestamp(item.createdAt)}</span>
        </div>
        <div className={styles.gridCardDetail}>
          <AlertCircle size={16} />
          <span>
            Priorité:{" "}
            <strong className={`${styles.gridCardPriority} ${styles[priority]}`}>
              {getPriorityText(priority)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReclamationGridCard;