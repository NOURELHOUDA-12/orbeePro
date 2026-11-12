const styles = `
  .task-manager-container { min-height: 100vh; background: linear-gradient(135deg, #FBBF24 0%, #cb9b23 100%); padding: 2rem; font-family: 'Inter', sans-serif; }
  .task-manager-header { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(10px); border-radius: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1); padding: 2rem; margin-bottom: 2rem; border: 1px solid rgba(255, 255, 255, 0.5); }
  .task-manager-title { font-size: 2rem; font-weight: 800; color: #1a202c; margin-bottom: 0.5rem; letter-spacing: -0.5px; }
  .task-manager-subtitle { color: #718096; font-size: 1rem; }

  /* ── Boutons ── */
  .task-add-button { display: flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.875rem 1.5rem; border-radius: 16px; border: none; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); }
  .task-add-button:hover { transform: translateY(-2px); box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5); }

  /* ── Toggles de vue ── */
  .task-view-toggle { display: flex; gap: 0.5rem; background: #f7fafc; padding: 0.375rem; border-radius: 12px; }
  .task-view-button { padding: 0.5rem 1rem; border: none; background: transparent; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s ease; color: #718096; }
  .task-view-button.active { background: white; color: #667eea; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }

  /* ── Vue compacte (liste) ── */
  .task-compact-list { background: rgba(255, 255, 255, 0.98); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); }
  .task-compact-item { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid #f7fafc; transition: all 0.2s ease; cursor: pointer; position: relative; }
  .task-compact-item:hover { background: #f7fafc; }
  .task-compact-item:last-child { border-bottom: none; }
  .task-compact-avatar { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; border: 2px solid #f7fafc; flex-shrink: 0; }
  .task-compact-avatar-placeholder { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
  .task-compact-info { flex: 1; min-width: 0; }
  .task-compact-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; flex-wrap: wrap; }
  .task-compact-name { font-weight: 600; color: #1a202c; font-size: 0.9375rem; }
  .task-compact-type { background: #f7fafc; color: #4a5568; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
  .task-compact-details { display: flex; align-items: center; gap: 1rem; color: #718096; font-size: 0.8125rem; flex-wrap: wrap; }
  .task-compact-detail { display: flex; align-items: center; gap: 0.375rem; }

  /* ── Badges statut ── */
  .task-compact-status { padding: 0.375rem 0.875rem; border-radius: 8px; font-weight: 600; font-size: 0.75rem; display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
  .task-compact-status.completed { background: rgba(16, 185, 129, 0.1); color: #059669; }
  .task-compact-status.in-progress { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
  .task-compact-status.pending { background: rgba(245, 158, 11, 0.1); color: #d97706; }

  /* ── Expand / Collapse ── */
  .task-compact-expand { flex-shrink: 0; padding: 0.5rem; border: none; background: transparent; cursor: pointer; color: #a0aec0; transition: all 0.2s ease; border-radius: 8px; }
  .task-compact-expand:hover { background: #f7fafc; color: #667eea; }
  .task-expanded-content { padding: 1rem 1.5rem 1.5rem 5rem; background: #f7fafc; border-top: 1px solid #e2e8f0; animation: slideDown 0.2s ease; }
  @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
  .task-expanded-notes { background: white; padding: 1rem; border-radius: 12px; color: #4a5568; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem; }
  .task-expanded-meta { display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.8125rem; }
  .task-expanded-meta-item { display: flex; align-items: center; gap: 0.5rem; color: #718096; }
  .task-expanded-meta-label { font-weight: 600; color: #4a5568; }

  /* ── Vue grille (cards) ── */
  .task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.5rem; }
  .task-card { background: rgba(255, 255, 255, 0.98); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; border: 1px solid rgba(255, 255, 255, 0.5); position: relative; }
  .task-card:hover { transform: translateY(-5px); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); }
  .task-status-bar { height: 4px; width: 100%; }
  .task-status-completed { background: linear-gradient(90deg, #10b981, #059669); }
  .task-status-in-progress { background: linear-gradient(90deg, #3b82f6, #2563eb); }
  .task-status-pending { background: linear-gradient(90deg, #f59e0b, #d97706); }
  .task-card-content { padding: 1.5rem; }
  .task-employee-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
  .task-employee-avatar { width: 60px; height: 60px; border-radius: 16px; object-fit: cover; border: 3px solid #f7fafc; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
  .task-employee-avatar-placeholder { width: 60px; height: 60px; border-radius: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.25rem; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }
  .task-employee-name { font-weight: 600; font-size: 1.125rem; color: #1a202c; margin-bottom: 0.25rem; }
  .task-employee-room { font-size: 0.875rem; color: #718096; }
  .task-recurring-badge { background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%); color: white; padding: 0.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3); }
  .task-type-badge { display: inline-block; background: #f7fafc; color: #2d3748; padding: 0.625rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 0.875rem; margin-bottom: 1rem; }
  .task-info-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-size: 0.875rem; color: #4a5568; }
  .task-info-label { color: #718096; }
  .task-info-value { font-weight: 600; color: #1a202c; }
  .task-notes { background: #f7fafc; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; font-size: 0.875rem; color: #4a5568; line-height: 1.6; }

  /* ── Badges statut (cards) ── */
  .task-status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 12px; font-weight: 600; font-size: 0.875rem; }
  .task-status-completed-badge { background: rgba(16, 185, 129, 0.1); color: #059669; }
  .task-status-in-progress-badge { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
  .task-status-pending-badge { background: rgba(245, 158, 11, 0.1); color: #d97706; }

  /* ── Modal ── */
  .task-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 1000; animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .task-modal { background: white; border-radius: 24px; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3); max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .task-modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: white; z-index: 10; }
  .task-modal-title { font-size: 1.5rem; font-weight: 700; color: #1a202c; }
  .task-modal-close { padding: 0.5rem; border: none; background: #f7fafc; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; color: #4a5568; }
  .task-modal-close:hover { background: #e2e8f0; }
  .task-modal-body { padding: 1.5rem; }
  .task-form-group { margin-bottom: 1.5rem; }
  .task-form-label { display: block; font-size: 0.875rem; font-weight: 600; color: #2d3748; margin-bottom: 0.5rem; }
  .task-form-input, .task-form-select, .task-form-textarea { width: 100%; padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 0.9375rem; transition: all 0.2s ease; font-family: inherit; box-sizing: border-box; }
  .task-form-input:focus, .task-form-select:focus, .task-form-textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
  .task-form-textarea { resize: none; min-height: 100px; }
  .task-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
  .task-checkbox-container { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 12px; border: 2px solid rgba(168, 85, 247, 0.2); cursor: pointer; transition: all 0.2s ease; }
  .task-checkbox-container:hover { border-color: rgba(168, 85, 247, 0.4); }
  .task-checkbox { width: 20px; height: 20px; cursor: pointer; accent-color: #a855f7; }
  .task-checkbox-label { font-weight: 600; color: #6b21a8; cursor: pointer; }
  .task-modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 1rem; position: sticky; bottom: 0; background: white; }
  .task-button { flex: 1; padding: 0.875rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: none; font-size: 0.9375rem; }
  .task-button-cancel { background: #f7fafc; color: #4a5568; }
  .task-button-cancel:hover { background: #e2e8f0; }
  .task-button-submit { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3); }
  .task-button-submit:hover { transform: translateY(-2px); box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4); }

  /* ── Recherche staff ── */
  .task-staff-list { max-height: 200px; overflow-y: auto; border: 2px solid #e2e8f0; border-radius: 12px; margin-top: 0.5rem; }
  .task-staff-item { padding: 0.875rem; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s ease; border-bottom: 1px solid #f7fafc; }
  .task-staff-item:hover { background: #f7fafc; }
  .task-staff-item:last-child { border-bottom: none; }
  .task-staff-avatar-small { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; border: 2px solid #f7fafc; }
  .task-staff-avatar-placeholder-small { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.875rem; }
  .task-staff-name { font-weight: 600; color: #1a202c; font-size: 0.9375rem; }
  .task-search-input { width: 100%; padding: 0.875rem 1rem 0.875rem 2.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 0.9375rem; transition: all 0.2s ease; box-sizing: border-box; }
  .task-search-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
  .task-search-container { position: relative; }
  .task-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #a0aec0; }

  /* ── États ── */
  .task-loading { text-align: center; padding: 2rem; color: #718096; font-size: 1rem; }
  .task-empty { text-align: center; padding: 3rem 2rem; color: #718096; }
  .task-empty-title { font-size: 1.25rem; font-weight: 600; color: #2d3748; margin-bottom: 0.5rem; }

  /* ── Stats ── */
  .task-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .task-stat-card { background: rgba(255, 255, 255, 0.98); padding: 1.25rem; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
  .task-stat-value { font-size: 2rem; font-weight: 700; color: #1a202c; margin-bottom: 0.25rem; }
  .task-stat-label { font-size: 0.875rem; color: #718096; font-weight: 500; }

  /* ── Boutons d'action ── */
  .task-actions { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
  .task-action-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: none; border-radius: 8px; font-weight: 600; font-size: 0.75rem; cursor: pointer; transition: all 0.2s ease; }
  .task-action-edit { background: rgba(59, 130, 246, 0.1); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2); }
  .task-action-edit:hover { background: rgba(59, 130, 246, 0.2); }
  .task-action-delete { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2); }
  .task-action-delete:hover { background: rgba(239, 68, 68, 0.2); }
  .task-action-start { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
  .task-action-start:hover { background: rgba(16, 185, 129, 0.2); }
  .task-action-complete { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
  .task-action-complete:hover { background: rgba(16, 185, 129, 0.2); }
  .task-compact-actions { display: flex; gap: 0.5rem; margin-left: auto; }
  .task-compact-action-button { padding: 0.375rem; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; background: transparent; }
  .task-compact-action-edit { color: #2563eb; }
  .task-compact-action-edit:hover { background: rgba(59, 130, 246, 0.1); }
  .task-compact-action-delete { color: #dc2626; }
  .task-compact-action-delete:hover { background: rgba(239, 68, 68, 0.1); }

  /* ── Modal confirmation suppression ── */
  .confirm-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 2000; }
  .confirm-modal { background: white; border-radius: 16px; padding: 2rem; max-width: 400px; width: 100%; text-align: center; }
  .confirm-modal-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #1a202c; }
  .confirm-modal-message { color: #718096; margin-bottom: 2rem; }
  .confirm-modal-actions { display: flex; gap: 1rem; }
  .confirm-button { flex: 1; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
  .confirm-button-cancel { background: #f7fafc; color: #4a5568; }
  .confirm-button-cancel:hover { background: #e2e8f0; }
  .confirm-button-confirm { background: #dc2626; color: white; }
  .confirm-button-confirm:hover { background: #b91c1c; }

  /* ── Vue mois (groupée par employé) ── */
  .employee-group { background: rgba(255, 255, 255, 0.98); border-radius: 20px; overflow: hidden; margin-bottom: 1.5rem; }
  .employee-group-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; cursor: pointer; transition: all 0.2s ease; }
  .employee-group-header:hover { background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%); }
  .employee-group-avatar { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; border: 3px solid white; }
  .employee-group-avatar-placeholder { width: 64px; height: 64px; border-radius: 16px; background: white; display: flex; align-items: center; justify-content: center; color: #667eea; font-weight: 700; font-size: 1.5rem; }
  .employee-group-name { color: white; font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
  .employee-group-position { color: rgba(255,255,255,0.9); font-size: 0.875rem; }
  .employee-group-stat { padding: 0.75rem 1rem; border-radius: 12px; text-align: center; min-width: 80px; }
  .employee-group-stat-value { color: white; font-size: 1.5rem; font-weight: 700; }
  .employee-group-stat-label { color: rgba(255,255,255,0.9); font-size: 0.75rem; font-weight: 600; }
  .employee-group-body { padding: 1rem; }

  /* ── Sélecteur de date ── */
  .date-picker-dropdown { position: absolute; top: 100%; left: 0; margin-top: 0.5rem; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); padding: 1rem; z-index: 1000; min-width: 280px; }
  .date-picker-label { font-size: 0.875rem; font-weight: 600; color: #2d3748; display: block; margin-bottom: 0.5rem; }
  .date-picker-input { padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; width: 100%; box-sizing: border-box; }
  .date-picker-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .date-picker-btn { flex: 1; padding: 0.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.8125rem; font-weight: 600; }
  .date-picker-btn-today { background: #f7fafc; color: #4a5568; }
  .date-picker-btn-close { background: #667eea; color: white; }
  .date-nav-btn { display: flex; align-items: center; justify-content: center; background: white; border: 2px solid #e2e8f0; border-radius: 10px; padding: 0.5rem; cursor: pointer; color: #4a5568; transition: all 0.2s ease; }
  .date-nav-btn:hover { border-color: #667eea; color: #667eea; }
  .date-display-btn { display: flex; align-items: center; gap: 0.5rem; background: white; border: 2px solid #667eea; border-radius: 12px; padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; color: #667eea; font-size: 0.875rem; min-width: 200px; transition: all 0.2s ease; }
  .date-display-btn:hover { background: #667eea; color: white; }

 .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          padding: 1rem;
        }
        .task-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-left: 5px solid #ccc;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .status-pending { border-left-color: #64748b; }
        .status-in-progress { border-left-color: #3b82f6; background: #eff6ff; }
        .status-paused { border-left-color: #f59e0b; background: #fffbeb; }
        .status-completed { border-left-color: #10b981; opacity: 0.8; }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-badge.pending { background: #f1f5f9; color: #475569; }
        .status-badge.in-progress { background: #dbeafe; color: #1e40af; }
        .status-badge.paused { background: #fef3c7; color: #92400e; }
        .status-badge.completed { background: #d1fae5; color: #065f46; }

        .timer-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: monospace;
          font-weight: bold;
          color: #64748b;
        }
        .timer-display.active { color: #2563eb; animation: pulse 2s infinite; }

        .task-title { margin: 0; font-size: 1.1rem; color: #1e293b; }
        .task-info { display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0; }
        .info-item { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.9rem; }
        
        .task-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: auto;
        }
        button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-start { background: #3b82f6; color: white; }
        .btn-pause { background: #f59e0b; color: white; }
        .btn-resume { background: #10b981; color: white; }
        .btn-complete { background: #059669; color: white; }
        .completed-label { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #059669; }
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  padding: 0;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.modal-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }

.close-btn {
  background: none; border: none; font-size: 1.5rem; 
  cursor: pointer; color: #64748b; font-weight: bold;
}

.modal-body { padding: 1.25rem; max-height: 60vh; overflow-y: auto; }

.history-item {
  padding: 1rem;
  border-left: 3px solid #f59e0b;
  background: #fffbeb;
  margin-bottom: 0.75rem;
  border-radius: 0 8px 8px 0;
}

.history-date {
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.history-reason { color: #475569; font-size: 0.95rem; line-height: 1.4; }

.no-data { text-align: center; color: #64748b; padding: 2rem 0; }



        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }


  .btn-history {
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
    padding: 5px;
    width: auto;
    flex: none; /* Pour ne pas qu'il prenne toute la place */
}
.btn-history:hover {
    background: #f1f5f9;
    color: #1e293b;
}
  /* ── Responsive ── */
  @media (max-width: 768px) {
    .task-manager-container { padding: 1rem; }
    .task-grid { grid-template-columns: 1fr; }
    .task-form-grid { grid-template-columns: 1fr; }
    .task-manager-header { flex-direction: column; gap: 1rem; }
    .task-add-button { width: 100%; justify-content: center; }
    .task-compact-item { flex-wrap: wrap; }
    .task-compact-status { order: -1; width: 100%; justify-content: center; }
    .task-expanded-content { padding-left: 1.5rem; }
    .task-compact-actions { margin-left: 0; margin-top: 0.5rem; width: 100%; justify-content: flex-end; }
    .employee-group-header { flex-direction: column; text-align: center; }
  }




  /* --- Overlay & Container --- */
.modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.7); /* Fond sombre bleuté */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
    padding: 1rem;
}

.modal-content {
    background: white;
    width: 100%;
    max-width: 600px;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideUp 0.3s ease-out;
    overflow: hidden;
}

/* --- Header --- */
.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
}

.header-title { display: flex; align-items: center; gap: 0.75rem; }
.header-title h3 { margin: 0; font-size: 1.25rem; color: #1e293b; }

.close-btn { 
    background: none; border: none; color: #64748b; 
    cursor: pointer; transition: color 0.2s; 
}
.close-btn:hover { color: #ef4444; }

/* --- Table & Body --- */
.modal-body {
    padding: 1rem;
    max-height: 400px;
    overflow-y: auto;
}

.table-container { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }

.history-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.9rem;
}

.history-table th {
    background: #f1f5f9;
    padding: 12px;
    color: #475569;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
}

.history-table td {
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
}

.history-table tr:last-child td { border-bottom: none; }

/* --- Helpers --- */
.text-mono { font-family: 'Courier New', monospace; font-weight: 500; }
.reason-cell { color: #475569; font-style: italic; }
.status-live { 
    color: #f59e0b; font-weight: 700; font-size: 0.75rem;
    animation: pulse 1.5s infinite;
}

.modal-footer {
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    text-align: right;
    background: #f8fafc;
}

.btn-close-footer {
    padding: 0.5rem 1.5rem;
    background: #64748b;
    color: white;
    border-radius: 6px;
    border: none;
    cursor: pointer;
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}


.duration-cell {
    font-weight: 600;
    color: #2563eb; /* Un bleu soutenu pour la durée */
    background: #f0f9ff; /* Un fond bleu très léger */
    text-align: center;
}

.history-table td.duration-cell {
    border-radius: 4px;
}
`;

export default styles;