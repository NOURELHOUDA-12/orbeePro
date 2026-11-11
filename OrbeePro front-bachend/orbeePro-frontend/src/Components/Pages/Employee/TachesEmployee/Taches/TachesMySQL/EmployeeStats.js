import React from "react";

const EmployeeStats = ({ tasks, activeFilter, onFilterClick }) => {
  const stats = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    paused: tasks.filter(t => t.status === "paused").length,
  };

  const cards = [
    { id: 'all', label: 'Total', value: stats.all, color: '#1a202c' },
    { id: 'pending', label: 'À faire', value: stats.pending, color: '#d97706' },
    { id: 'in-progress', label: 'En cours', value: stats.inProgress, color: '#2563eb' },
    { id: 'completed', label: 'Terminées', value: stats.completed, color: '#059669' },
    { id: 'paused', label: 'en pause', value: stats.paused, color: '#64bce1' },
  ];

  return (
    <div className="task-stats">
      {cards.map(card => (
        <div 
          key={card.id} 
          className="task-stat-card" 
          onClick={() => onFilterClick(card.id)}
          style={{ 
            cursor: 'pointer',
            border: activeFilter === card.id ? `2px solid #667eea` : '2px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <div className="task-stat-value" style={{ color: card.color }}>{card.value}</div>
          <div className="task-stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeStats;