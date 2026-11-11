export const styles = `
  .reclamations-container { 
    min-height: 100vh; 
    background: linear-gradient(135deg, #FBBF24 0%, #cb9b23 100%); 
    padding: 2rem; 
    font-family: 'Inter', sans-serif; 
  }
  .reclamations-header { 
    background: rgba(255, 255, 255, 0.98); 
    backdrop-filter: blur(10px); 
    border-radius: 24px; 
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1); 
    padding: 2rem; 
    margin-bottom: 2rem; 
    border: 1px solid rgba(255, 255, 255, 0.5); 
  }
  .reclamations-title { 
    font-size: 2rem; 
    font-weight: 800; 
    color: #1a202c; 
    margin-bottom: 0.5rem; 
    letter-spacing: -0.5px; 
  }
  .reclamations-subtitle { 
    color: #718096; 
    font-size: 1rem; 
  }
  .stats-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
    gap: 1rem; 
    margin-bottom: 1.5rem; 
  }
  .stat-card { 
    background: rgba(255, 255, 255, 0.98); 
    padding: 1.25rem; 
    border-radius: 16px; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); 
  }
  .stat-value { 
    font-size: 2rem; 
    font-weight: 700; 
    color: #1a202c; 
    margin-bottom: 0.25rem; 
  }
  .stat-label { 
    font-size: 0.875rem; 
    color: #718096; 
    font-weight: 500; 
  }
  .view-toggle { 
    display: flex; 
    gap: 0.5rem; 
    background: #f7fafc; 
    padding: 0.375rem; 
    border-radius: 12px; 
  }
  .view-button { 
    padding: 0.5rem 1rem; 
    border: none; 
    background: transparent; 
    border-radius: 8px; 
    font-weight: 600; 
    font-size: 0.875rem; 
    cursor: pointer; 
    transition: all 0.2s ease; 
    color: #718096; 
  }
  .view-button.active { 
    background: white; 
    color: #667eea; 
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); 
  }
  .add-button { 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: white; 
    padding: 0.875rem 1.5rem; 
    border-radius: 16px; 
    border: none; 
    font-weight: 600; 
    cursor: pointer; 
    transition: all 0.3s ease; 
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); 
  }
  .add-button:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5); 
  }
  .filters-container { 
    background: rgba(255, 255, 255, 0.98); 
    padding: 1.5rem; 
    border-radius: 20px; 
    margin-bottom: 1.5rem; 
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); 
  }
  .filters-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
    gap: 1rem; 
  }
  .filter-group { 
    margin-bottom: 1rem; 
  }
  .filter-label { 
    display: block; 
    font-size: 0.875rem; 
    font-weight: 600; 
    color: #2d3748; 
    margin-bottom: 0.5rem; 
  }
  .filter-input, .filter-select { 
    width: 100%; 
    padding: 0.875rem 1rem; 
    border: 2px solid #e2e8f0; 
    border-radius: 12px; 
    font-size: 0.9375rem; 
    transition: all 0.2s ease; 
    font-family: inherit; 
  }
  .filter-input:focus, .filter-select:focus { 
    outline: none; 
    border-color: #667eea; 
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); 
  }
  .search-container { 
    position: relative; 
  }
  .search-icon { 
    position: absolute; 
    left: 1rem; 
    top: 50%; 
    transform: translateY(-50%); 
    color: #a0aec0; 
  }
  .search-input { 
    width: 100%; 
    padding: 0.875rem 1rem 0.875rem 2.75rem; 
    border: 2px solid #e2e8f0; 
    border-radius: 12px; 
    font-size: 0.9375rem; 
    transition: all 0.2s ease; 
  }
  .reset-button { 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
    padding: 0.75rem 1.5rem; 
    background: #f7fafc; 
    color: #4a5568; 
    border: 2px solid #e2e8f0; 
    border-radius: 12px; 
    font-weight: 600; 
    cursor: pointer; 
    transition: all 0.2s ease; 
    font-size: 0.875rem; 
  }
  .reset-button:hover { 
    background: #e2e8f0; 
  }
  .table-container { 
    background: rgba(255, 255, 255, 0.98); 
    border-radius: 20px; 
    overflow: hidden; 
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); 
    margin-bottom: 1.5rem; 
  }
  .table { 
    width: 100%; 
    border-collapse: collapse; 
    min-width: 1000px; 
  }
  .table th { 
    padding: 1rem 1.5rem; 
    text-align: left; 
    font-size: 0.875rem; 
    font-weight: 700; 
    color: #2d3748; 
    background: #f7fafc; 
    border-bottom: 2px solid #e2e8f0; 
  }
  .table td { 
    padding: 1rem 1.5rem; 
    border-bottom: 1px solid #f7fafc; 
    transition: all 0.2s ease; 
  }
  .table tr:hover td { 
    background: #f7fafc; 
  }
  .urgency-badge { 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
    padding: 0.5rem 1rem; 
    border-radius: 8px; 
    font-weight: 600; 
    font-size: 0.75rem; 
  }
  .status-select { 
    padding: 0.5rem 1rem; 
    border-radius: 8px; 
    border: 2px solid; 
    background: white; 
    font-weight: 600; 
    font-size: 0.75rem; 
    cursor: pointer; 
    transition: all 0.2s ease; 
  }
  .details-button { 
    padding: 0.5rem 1rem; 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: white; 
    border: none; 
    border-radius: 8px; 
    font-weight: 600; 
    font-size: 0.75rem; 
    cursor: pointer; 
    transition: all 0.2s ease; 
  }
  .details-button:hover { 
    transform: translateY(-1px); 
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); 
  }
  .pagination { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    background: rgba(255, 255, 255, 0.98); 
    padding: 1rem 1.5rem; 
    border-radius: 16px; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); 
    gap: 1rem; 
  }
  .pagination-info { 
    color: #0d0d0d; 
    font-size: 0.875rem; 
  }
  .pagination-buttons { 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
  }
  .page-button { 
    padding: 0.5rem 0.75rem; 
    border: 2px solid #e2e8f0; 
    background: white; 
    border-radius: 8px; 
    cursor: pointer; 
    font-weight: 600; 
    font-size: 0.875rem; 
    transition: all 0.2s ease; 
  }
  .page-button.active { 
    background: #667eea; 
    color: white; 
    border-color: #667eea; 
  }
  .page-button:hover:not(.active) { 
    background: #f7fafc; 
  }
  .items-per-page { 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
  }
  .items-select { 
    padding: 0.5rem; 
    border: 2px solid #e2e8f0; 
    border-radius: 8px; 
    background: white; 
    font-size: 0.875rem; 
    cursor: pointer; 
  }
  .agent-card { 
    background: rgba(255, 255, 255, 0.98); 
    padding: 1.5rem; 
    border-radius: 20px; 
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); 
    margin-bottom: 1rem; 
  }
  .modal-overlay { 
    position: fixed; 
    inset: 0; 
    background: rgba(0, 0, 0, 0.6); 
    backdrop-filter: blur(4px); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    padding: 1rem; 
    z-index: 1000; 
  }
  .modal { 
    background: white; 
    border-radius: 24px; 
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3); 
    max-width: 600px; 
    width: 100%; 
    max-height: 90vh; 
    overflow-y: auto; 
  }
  .modal-header { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    padding: 1.5rem; 
    border-radius: 24px 24px 0 0; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
  }
  .modal-title { 
    color: white; 
    font-size: 1.5rem; 
    font-weight: 700; 
    margin: 0; 
  }
  .modal-close { 
    background: rgba(255, 255, 255, 0.2); 
    border: none; 
    color: white; 
    width: 40px; 
    height: 40px; 
    border-radius: 50%; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    transition: all 0.2s ease; 
  }
  .modal-close:hover { 
    background: rgba(255, 255, 255, 0.3); 
  }
  .modal-body { 
    padding: 1.5rem; 
  }
  .empty-state { 
    text-align: center; 
    padding: 3rem 2rem; 
    color: #718096; 
  }
  .empty-title { 
    font-size: 1.25rem; 
    font-weight: 600; 
    color: #2d3748; 
    margin-bottom: 0.5rem; 
  }

  @media (max-width: 768px) {
    .reclamations-container { padding: 1rem; }
    .filters-grid { grid-template-columns: 1fr; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .view-toggle { flex-wrap: wrap; }
    .add-button { width: 100%; justify-content: center; }
    .pagination { 
      flex-direction: column; 
      gap: 1rem; 
      align-items: stretch; 
    }
    .pagination-buttons { 
      justify-content: center; 
    }
    .items-per-page { 
      justify-content: center; 
    }
  }
`;

export default styles;