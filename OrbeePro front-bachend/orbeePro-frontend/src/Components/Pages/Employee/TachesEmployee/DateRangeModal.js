import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DateRangeModal.module.css';

// Fonction utilitaire pour les dates
const getLocalDateString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Composant MiniCalendar avec CSS Module
const MiniCalendar = ({
  displayDate,
  startDate,
  endDate,
  onDateClick,
  monthName
}) => {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const todayStr = getLocalDateString(new Date());

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayRaw = getFirstDayOfMonth(year, month);
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const days = [];
  
  // Jours du mois précédent
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const date = new Date(year, month - 1, day);
    const dateStr = getLocalDateString(date);
    days.push(
      <button 
        key={`prev-${i}`} 
        className={`${styles.day} ${styles.dayOtherMonth}`}
        onClick={() => onDateClick(dateStr)}
      >
        {day}
      </button>
    );
  }

  // Jours du mois actuel
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dateStr = getLocalDateString(date);
    
    let isSelected = false;
    let inRange = false;
    let isStart = false;
    let isEnd = false;

    if (startDate) {
      if (dateStr === startDate) {
        isSelected = true;
        isStart = true;
      }
      if (endDate) {
        if (dateStr === endDate) {
          isSelected = true;
          isEnd = true;
        }
        if (dateStr > startDate && dateStr < endDate) {
          inRange = true;
        }
        
      }
      if (startDate === endDate && dateStr === startDate) {
        isStart = true;
        isEnd = true;
      }
    }
    
    const isToday = dateStr === todayStr;

    const dayClassNames = [
      styles.day,
      isToday ? styles.dayToday : '',
      isSelected ? styles.daySelected : '',
      inRange ? styles.dayInRange : '',
      isStart ? styles.dayRangeStart : '',
      isEnd ? styles.dayRangeEnd : '',
      isStart && isEnd ? styles.dayRangeStartEnd : ''
    ].filter(Boolean).join(' ');

    days.push(
      <button 
        key={`current-${i}`} 
        className={dayClassNames}
        onClick={() => onDateClick(dateStr)}
      >
        {i}
      </button>
    );
  }

  // Jours du mois suivant
  const totalCells = 42;
  const nextMonthDays = totalCells - days.length;
  for (let i = 1; i <= nextMonthDays; i++) {
    const date = new Date(year, month + 1, i);
    const dateStr = getLocalDateString(date);
    days.push(
      <button 
        key={`next-${i}`} 
        className={`${styles.day} ${styles.dayOtherMonth}`}
        onClick={() => onDateClick(dateStr)}
      >
        {i}
      </button>
    );
  }

  const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className={styles.miniCalendar}>
      <div className={styles.miniCalendarHeader}>
        {monthName}
      </div>
      <div className={styles.weekdaysGrid}>
        {weekdays.map(day => (
          <div key={day} className={styles.weekday}>{day}</div>
        ))}
      </div>
      <div className={styles.daysGrid}>
        {days}
      </div>
    </div>
  );
};

// Composant principal DateRangeModal
const DateRangeModal = ({ isOpen, onClose, onSubmit, initialStartDate, initialEndDate }) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  
  const [cal1Date, setCal1Date] = useState(new Date(initialStartDate + 'T00:00:00' || new Date()));
  const [cal2Date, setCal2Date] = useState(() => {
    const d = new Date(initialStartDate + 'T00:00:00' || new Date());
    d.setMonth(d.getMonth() + 1);
    return d;
  });

  useEffect(() => {
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    const d1 = new Date(initialStartDate + 'T00:00:00' || new Date());
    d1.setDate(1);
    const d2 = new Date(d1);
    d2.setMonth(d2.getMonth() + 1);
    setCal1Date(d1);
    setCal2Date(d2);
  }, [isOpen, initialStartDate, initialEndDate]);

  if (!isOpen) return null;

  const navigateMonths = (direction) => {
    setCal1Date(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
    setCal2Date(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
  };

  const handleDateClick = (dateStr) => {
    if (!startDate || endDate) {
      setStartDate(dateStr);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (dateStr < startDate) {
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const handleSubmit = () => {
    const finalEndDate = endDate || startDate;
    onSubmit(startDate, finalEndDate);
    onClose();
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'Sélectionner...';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div className={styles.header}>
          <h3 className={styles.title}>Sélectionner une plage de dates</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* Affichage des dates sélectionnées */}
        <div className={styles.displayContainer}>
          <div className={styles.display}>
            <div className={`${styles.displayDate} ${startDate ? styles.displayDateActive : ''}`}>
              {formatDateForDisplay(startDate)}
            </div>
            <div className={styles.displaySeparator}>→</div>
            <div className={`${styles.displayDate} ${endDate ? styles.displayDateActive : ''}`}>
              {formatDateForDisplay(endDate)}
            </div>
          </div>
        </div>

        {/* Indicateur */}
        <div className={styles.hint}>
          {!startDate && "Cliquez sur une date pour commencer la sélection"}
          {startDate && !endDate && "Cliquez sur une date pour terminer la sélection"}
          {startDate && endDate && "Plage sélectionnée ✓"}
        </div>

        {/* Calendriers avec navigation */}
        <div className={styles.calendarsContainer}>
          <button 
            className={styles.navButton}
            onClick={() => navigateMonths(-1)}
            title="Mois précédent"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className={styles.calendarsWrapper}>
            <MiniCalendar 
              displayDate={cal1Date}
              startDate={startDate}
              endDate={endDate}
              onDateClick={handleDateClick}
              monthName={getMonthName(cal1Date)}
            />
            <MiniCalendar 
              displayDate={cal2Date}
              startDate={startDate}
              endDate={endDate}
              onDateClick={handleDateClick}
              monthName={getMonthName(cal2Date)}
            />
          </div>
          
          <button 
            className={styles.navButton}
            onClick={() => navigateMonths(1)}
            title="Mois suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button 
            onClick={onClose}
            className={`${styles.actionButton} ${styles.actionButtonCancel}`}
          >
            Annuler
          </button>
          <button 
            onClick={handleSubmit} 
            className={`${styles.actionButton} ${styles.actionButtonApply}`}
            disabled={!startDate}
          >
            Appliquer la plage
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangeModal;


