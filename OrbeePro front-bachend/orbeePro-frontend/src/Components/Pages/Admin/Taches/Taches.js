import React, { useState, useEffect } from "react";
import Stats from "./Stats";
import Filtres from "./Filtres";
import ListeTasks from "./ListeTasks";
import { taskService } from "../../../../services/taskService";

import styles from './styleTaches';

const TaskManager = () => {
  const [allTasks, setAllTasks] = useState([]); 
  const [filteredTasks, setFilteredTasks] = useState([]); 
  const [currentFilter, setCurrentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);

        const data = await taskService.getAll(); 

        
         
        if (data && data.tasks && Array.isArray(data.tasks)) {
          setAllTasks(data.tasks);
          setFilteredTasks(data.tasks);
          setError(null);
        } 
        // Si la réponse a une structure avec success
        else if (data && data.success && data.tasks) {
          setAllTasks(data.tasks);
          setFilteredTasks(data.tasks);
          setError(null);
        }
        else {
          console.error("Format de réponse inattendu:", data);
          setError("Format de données incorrect");
          // Initialiser avec tableau vide pour éviter les erreurs
          setAllTasks([]);
          setFilteredTasks([]);
        }
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError(err.message);
        setAllTasks([]);
        setFilteredTasks([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTasks();
  }, []);

  // Fonction pour gérer le changement de filtre
  const handleFilterChange = (filterType) => {
    setCurrentFilter(filterType);
    
    // Logique de filtrage simple
    let filtered = allTasks;
    if (filterType === "completed") {
      filtered = allTasks.filter(task => task.status === "completed");
    } else if (filterType === "pending") {
      filtered = allTasks.filter(task => task.status !== "completed");
    }
    
    setFilteredTasks(filtered);
  };


  if (loading) {
    return <div className="loading" style={{ padding: "2rem", textAlign: "center" }}>
      Chargement des tâches...
    </div>;
  }

  if (error) {
    return <div className="error" style={{ padding: "2rem", textAlign: "center", color: "red" }}>
      Erreur: {error}
    </div>;
  }

  return (
    <>
      <style>{styles}</style>
      
      {/* Passage des tâches au composant Filtre */}
      <Filtres 
        tasksFromParent={allTasks} 
        onFilterChange={handleFilterChange}
      />

      {/* Affichage de la liste filtrée */}
      <ListeTasks tasks={filteredTasks} /> 
    </>
  );
};

export default TaskManager;