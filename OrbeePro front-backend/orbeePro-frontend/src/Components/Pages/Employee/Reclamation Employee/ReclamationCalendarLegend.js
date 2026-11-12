
import React from "react";
import styles from "./reclamation.module.css";
import { PRIORITY_COLORS } from "./Utils";

const ReclamationCalendarLegend = () => {
  return (
    <div className={styles.calendarLegend}>
      <h4 className={styles.calendarLegendTitle}>🎨 Légende des Priorités</h4>
      <div className={styles.legendItems}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendColorBox}
            style={{ backgroundColor: PRIORITY_COLORS.tres_urgent }}
          ></span>
          Très Urgent
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendColorBox}
            style={{ backgroundColor: PRIORITY_COLORS.urgent }}
          ></span>
          Urgent
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendColorBox}
            style={{ backgroundColor: PRIORITY_COLORS.normal }}
          ></span>
          Normal
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendColorBox}
            style={{ backgroundColor: PRIORITY_COLORS.faible }}
          ></span>
          Faible
        </div>
      </div>
    </div>
  );
};


export default ReclamationCalendarLegend;