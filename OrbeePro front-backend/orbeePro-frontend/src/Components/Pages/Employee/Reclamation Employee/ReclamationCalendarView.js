import React, { useState, useMemo } from "react";
import { Calendar } from "react-calendar";
import { AlertCircle } from "lucide-react";
import styles from "./reclamation.module.css";
import ReclamationListItem from "./ReclamationListItem";
import ReclamationCalendarLegend from "./ReclamationCalendarLegend";
import { getLocalDateString, PRIORITY_COLORS, STATUS_COLORS, getPriorityText, getReclamationStatusText,PRIORITY_ORDER } from "./Utils";

const ReclamationCalendarView = ({ items, ...props }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const reclamationsByDate = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      if (!item.createdAt) return;
      const dateStr = getLocalDateString(
        item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt
      );
      if (!dateStr) return;

      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr).push(item);
    });
    
    for (let tasks of map.values()) {
      tasks.sort((a, b) => {
        const prioA = PRIORITY_ORDER[a.priority || a.urgency] || 5;
        const prioB = PRIORITY_ORDER[b.priority || b.urgency] || 5;
        return prioA - prioB;
      });
    }

    return map;
  }, [items]);

  const itemsForSelectedDate = useMemo(() => {
    const selectedDateStr = getLocalDateString(selectedDate);
    return reclamationsByDate.get(selectedDateStr) || [];
  }, [reclamationsByDate, selectedDate]);

  const renderTileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const dateStr = getLocalDateString(date);
    const tasksForDay = reclamationsByDate.get(dateStr);

    if (!tasksForDay || tasksForDay.length === 0) {
      return null;
    }

    const tasksToShow = tasksForDay.slice(0, 2);
    const remainingTasks = tasksForDay.length - tasksToShow.length;

    return (
      <div className={styles.calendarTileTaskList}>
        {tasksToShow.map((task) => {
          const priority = task.priority || task.urgency || "normal";
          const status = (task.status || 'pending').toLowerCase().trim();

          const borderColor = PRIORITY_COLORS[priority] || PRIORITY_COLORS.normal;
          const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.pending;

          return (
            <div
              key={task.id}
              className={styles.calendarTileTaskChip}
              style={{
                borderLeftColor: borderColor,
                backgroundColor: statusStyle.bg,
                color: statusStyle.color,
              }}
              title={`${task.description || task.problem} - ${getPriorityText(priority)} - ${getReclamationStatusText(status)}`}
            >
              {(priority === "tres_urgent" || priority === "urgent") && (
                <AlertCircle size={12} />
              )}
              <span className={styles.chipText}>
                {task.description || task.problem}
              </span>
            </div>
          );
        })}
        {remainingTasks > 0 && (
          <div className={styles.calendarTileTaskMore}>
            + {remainingTasks} autre(s)
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.calendarViewContainer}>
      <ReclamationCalendarLegend />

      <div className={styles.calendarWrapper}>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileContent={renderTileContent}
          locale="fr-FR"
        />
      </div>

      <div className={styles.calendarItemsList}>
        <h3>
          📅 Réclamations du{" "}
          {selectedDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h3>
        {itemsForSelectedDate.length === 0 ? (
          <div className={styles.reclamationEmpty}>
            <div className={styles.emptyIcon}>📝</div>
            <h3 className={styles.emptyTitle}>Aucune réclamation</h3>
            <p className={styles.emptyDescription}>
              Aucune réclamation n'a été créée à cette date.
            </p>
          </div>
        ) : (
          <div className={styles.reclamationList}>
            {itemsForSelectedDate.map((item) => (
              <ReclamationListItem key={item.id} item={item} {...props} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReclamationCalendarView;