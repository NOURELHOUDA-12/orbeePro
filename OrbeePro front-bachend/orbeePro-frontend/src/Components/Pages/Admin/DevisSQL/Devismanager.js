import React, { useState, useEffect } from "react";
import DevisList from "./DevisList";
import DevisFormModal from "./DevisFormModal";
import DevisDetail from "./DevisDetail";
import ShareModal from "./ShareModal";
import DevisService from "../../../../services/DevisService";
import styles from "./devis.module.css";
import { FilePlus, List, ArrowLeft } from "lucide-react";

const Devismanager = () => {
  const [view, setView] = useState("list");
  const [devisList, setDevisList] = useState([]);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  // Charger les données au montage du composant
  const loadDevis = async () => {
    setLoading(true);
    try {
      const data = await DevisService.getAll();
      setDevisList(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des devis", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevis();
  }, []);

  

  // Action : Supprimer un devis
  const handleDeleteDevis = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce devis ?")) {
      try {
        await DevisService.delete(id);
        setDevisList(devisList.filter((d) => d.id !== id));
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className={styles.appContainer}>
      {/* Header de l'application */}
      <div
        className={styles.headerAction}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        
        {/* Navigation dynamique */}
        <div style={{ display: "flex", gap: "1rem" }}>
          {view === "list" ? (
            <button
              onClick={() => setShowModal(true)}
              className={styles.submitButton}
            >
              + Nouveau Devis
            </button>
          ) : (
            <button
              onClick={() => {
                setView("list");
                setSelectedDevis(null);
                    loadDevis();

              }}
              className={styles.cancelButton}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              <ArrowLeft size={20} /> Retour à la liste
            </button>
          )}
        </div>


        <DevisFormModal 
      showAddModal={showModal}
      onClose={() => setShowModal(false)}
      onSuccess={loadDevis}
    />
      </div>

      {/* Contenu Principal */}
      <div className={styles.mainContent}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px" }}>
            <div className={styles.loadingSpinner}></div>
            <p>Chargement de vos devis...</p>
          </div>
        ) : (
          <>
            {view === "list" && (
              <DevisList
                devis={devisList}
                onView={(d) => {
                  setSelectedDevis(d);
                  setView("detail");
                }}
                onDelete={handleDeleteDevis}
              />
            )}

            

            {view === "detail" && selectedDevis && (
              <DevisDetail
                devis={selectedDevis}
                onBack={() => setView("list")}
                onShare={(d) => setShareTarget(d)}
              />
            )}
          </>
        )}
      </div>

      {/* Modale de Partage */}
      {shareTarget && (
        <ShareModal devis={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
};

export default Devismanager;
