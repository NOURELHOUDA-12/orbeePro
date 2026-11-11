import React, { useState, useEffect } from 'react';
import {
    Add, Edit, Delete, Search, Close, ExpandMore, ExpandLess,
    Business, Public, Room, Wc, Restaurant, Kitchen,
    LocalLaundryService, Shower, MeetingRoom, Stairs,
    AssignmentInd, Check, Info, CalendarToday,
    Event, QrCode
} from '@mui/icons-material';
import CategorieModal from '../CategorieModal'
import QRCodePrinter from '../QrCode/QRCodePrinter';
import { spaceService } from '../../../../../services/EspaceServices';
import './espace.css'
const GestionEspacesHierarchie = () => {
    // === ÉTATS DES DONNÉES ===
    const [espaces, setEspaces] = useState([]);
    const [sousEspaces, setSousEspaces] = useState([]);
    const [categories, setCategories] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // === ÉTATS UI ===
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategorie, setFilterCategorie] = useState('all');
    const [expandedEspaces, setExpandedEspaces] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // === ÉTATS DES MODALES ===
    const [showEspaceModal, setShowEspaceModal] = useState(false);
    const [showSousEspaceModal, setShowSousEspaceModal] = useState(false);
    const [showCategorieModal, setShowCategorieModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    // === ÉTATS DE SÉLECTION ===
    const [selectedEspace, setSelectedEspace] = useState(null);
    const [selectedSousEspace, setSelectedSousEspace] = useState(null);
    const [qrCodeData, setQrCodeData] = useState({ valeur: '', titre: '' });

    // === FORMULAIRES ===
    const [espaceForm, setEspaceForm] = useState({ nom: '', type: 'etage', numero: '', categorieId: '', description: '' });
    const [sousEspaceForm, setSousEspaceForm] = 
    useState({ nom: '', numero: '', type: 'chambre', espaceParentId: '', superficie: '', capacite: '', statut: 'libre' });
    const [categorieForm, setCategorieForm] = useState({ nom: '', type: 'public', couleur: '#3B82F6', icone: 'public' });
    const [assignForm, setAssignForm] = useState({ employeId: '', typeTache: 'nettoyage', dateDebut: new Date().toISOString().split('T')[0], notes: '' });

    const categoriesDefaut = [
        { id: 'def1', nom: 'Public - Client', type: 'public', couleur: '#3B82F6', icone: 'public' },
        { id: 'def2', nom: 'Public - Commun', type: 'public', couleur: '#10B981', icone: 'meeting_room' },
        { id: 'def3', nom: 'Professionnel', type: 'professionnel', couleur: '#F59E0B', icone: 'business' }
    ];

    // === CHARGEMENT INITIAL (API) ===
    const loadAllData = async () => {
        setLoading(true);
        try {
            const data = await spaceService.getHierarchy();
            setEspaces(data.espaces || []);
            setSousEspaces(data.sousEspaces || []);
            setCategories([...categoriesDefaut, ...(data.categories || [])]);
            setEmployees(data.staff || []);
        } catch (error) {
            console.error("Erreur chargement MySQL:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAllData(); }, []);

    // === HANDLERS (CRUD) ===

    const handleSubmitEspace = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await spaceService.saveEspace(espaceForm, selectedEspace?.id);
            if (!selectedEspace) { 
                setQrCodeData({ valeur: res.id.toString(), titre: res.nom });
                setShowQRModal(true);
            }
            setShowEspaceModal(false);
            resetForms();
            loadAllData();
        } catch (err) { alert(err.message); }
        finally { setIsSubmitting(false); }
    };

    const handleSubmitSousEspace = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await spaceService.saveSousEspace(sousEspaceForm, selectedSousEspace?.id);
            if (result && result.id) {
                alert('✅ Sous-espace enregistré !');
                
                if (!selectedSousEspace) {
                    setQrCodeData({ 
                        valeur: String(result.id), 
                        titre: sousEspaceForm.numero 
                    });
                    setShowQRModal(true);
                }
                setShowSousEspaceModal(false);
                resetForms();
                loadAllData();
            } else {
                throw new Error("Le serveur n'a pas renvoyé d'ID valide.");
            }

        } catch (err) { 
            console.error("Erreur détaillée:", err);
            alert("Erreur: " + err.message); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleDeleteEspace = async (id) => {
        if (window.confirm("Supprimer cet espace et tous ses sous-espaces ?")) {
            await spaceService.deleteEspace(id);
            loadAllData();
        }
    };

    // === FONCTIONS D'AFFICHAGE ===
    const resetForms = () => {
        setEspaceForm({ nom: '', type: 'etage', numero: '', categorieId: '', description: '' });
        setSousEspaceForm({ nom: '', numero: '', type: 'chambre', espaceParentId: '', superficie: '', capacite: '', statut: 'libre' });
        setSelectedEspace(null);
        setSelectedSousEspace(null);
    };

    const toggleExpand = (id) => setExpandedEspaces(p => ({ ...p, [id]: !p[id] }));
    const getSousEspacesByParent = (pid) => sousEspaces.filter(se => se.espaceParentId === pid);
    const getCat = (id) => categories.find(c => c.id == id);
    const getIcon = (name) => {
        const map = { 'public': <Public />, 'business': <Business />, 'room': <Room />, 'wc': <Wc />, 'meeting_room': <MeetingRoom /> };
        return map[name] || <Public />;
    };

    const filtered = espaces.filter(e => 
        (e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || e.numero?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterCategorie === 'all' || e.categorieId == filterCategorie)
    );

    if (loading) return <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <p>Chargement de la structure OrbeePro...</p>
    </div>;

    return (
        <div style={styles.container}>
    

            {/* Statistiques Rapides */}
            <div style={styles.statsContainer}>
                <div style={{...styles.statCard, ...styles.statCardBlue}}>
                    <div style={styles.statIcon}>
                        <Business style={{fontSize: '32px'}} />
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{espaces.length}</h3>
                        <p style={styles.statLabel}>Espaces Parents</p>
                    </div>
                </div>
                <div style={{...styles.statCard, ...styles.statCardGreen}}>
                    <div style={styles.statIcon}>
                        <Room style={{fontSize: '32px'}} />
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{sousEspaces.length}</h3>
                        <p style={styles.statLabel}>Sous-Espaces</p>
                    </div>
                </div>
                <div style={{...styles.statCard, ...styles.statCardYellow}}>
                    <div style={styles.statIcon}>
                        <Public style={{fontSize: '32px'}} />
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{categories.length}</h3>
                        <p style={styles.statLabel}>Catégories</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={styles.toolbar}>
                <div style={styles.toolbarLeft}>
                    <button onClick={() => { resetForms(); setShowEspaceModal(true); }} style={styles.btnPrimary}>
                        <Add style={{fontSize: '20px'}} /> 
                        <span>Nouvel Espace</span>
                    </button>
                    <button onClick={() => setShowCategorieModal(true)} style={styles.btnSecondary}>
                        <Add style={{fontSize: '20px'}} /> 
                        <span>Catégorie</span>
                    </button>
                </div>
                <div style={styles.toolbarRight}>
                    <div style={styles.searchWrapper}>
                        <Search style={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un espace..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            style={styles.searchInput} 
                        />
                    </div>
                    <select 
                        value={filterCategorie} 
                        onChange={e => setFilterCategorie(e.target.value)} 
                        style={styles.select}
                    >
                        <option value="all">Toutes les catégories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                </div>
            </div>

            {/* Liste Principale */}
            <div style={styles.listContainer}>
                {filtered.length === 0 ? (
                    <div style={styles.emptyState}>
                        <Business style={{fontSize: '64px', color: '#D1D5DB', marginBottom: '16px'}} />
                        <p style={styles.emptyText}>Aucun espace trouvé</p>
                        <p style={styles.emptySubtext}>Créez votre premier espace pour commencer</p>
                    </div>
                ) : (
                    filtered.map(espace => {
                        const cat = getCat(espace.categorieId);
                        const enfants = getSousEspacesByParent(espace.id);
                        const expanded = expandedEspaces[espace.id];

                        return (
                            <div key={espace.id} style={{...styles.card, borderLeftColor: cat?.couleur || '#E5E7EB'}}>
                                <div style={styles.cardHeader}>
                                    <div style={styles.cardHeaderLeft}>
                                        <div style={{...styles.cardIcon, color: cat?.couleur || '#9CA3AF'}}>
                                            {getIcon(cat?.icone)}
                                        </div>
                                        <div>
                                            <h3 style={styles.cardTitle}>
                                                {espace.nom} 
                                                <span style={styles.cardSubtitle}>({espace.numero})</span>
                                            </h3>
                                            <span style={{...styles.badge, backgroundColor: cat?.couleur + '15', color: cat?.couleur}}>
                                                {cat?.nom}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={styles.cardActions}>
                                        <button 
                                            onClick={() => { setQrCodeData({ valeur: espace.id.toString(), titre: espace.nom }); setShowQRModal(true); }} 
                                            style={styles.actionBtn}
                                            title="QR Code"
                                        >
                                            <QrCode style={{fontSize: '20px'}} />
                                        </button>
                                        <button 
                                            onClick={() => { setSousEspaceForm({ ...sousEspaceForm, espaceParentId: espace.id }); setShowSousEspaceModal(true); }} 
                                            style={styles.actionBtn}
                                            title="Ajouter un sous-espace"
                                        >
                                            <Add style={{fontSize: '20px'}} />
                                        </button>
                                        <button 
                                            onClick={() => { setSelectedEspace(espace); setEspaceForm(espace); setShowEspaceModal(true); }} 
                                            style={styles.actionBtn}
                                            title="Modifier"
                                        >
                                            <Edit style={{fontSize: '20px'}} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteEspace(espace.id)} 
                                            style={{...styles.actionBtn, ...styles.actionBtnDanger}}
                                            title="Supprimer"
                                        >
                                            <Delete style={{fontSize: '20px'}} />
                                        </button>
                                        <button 
                                            onClick={() => toggleExpand(espace.id)} 
                                            style={styles.expandBtn}
                                        >
                                            {expanded ? <ExpandLess style={{fontSize: '24px'}} /> : <ExpandMore style={{fontSize: '24px'}} />}
                                            <span style={styles.childCount}>{enfants.length}</span>
                                        </button>
                                    </div>
                                </div>

                                {expanded && enfants.length > 0 && (
                                    <div style={styles.expandedContent}>
                                        <div style={styles.subGrid}>
                                            {enfants.map(se => (
                                                <div key={se.id} style={styles.subCard}>
                                                    <div style={styles.subCardHeader}>
                                                        <div>
                                                            <div style={styles.subCardNumber}>{se.numero}</div>
                                                            <div style={styles.subCardName}>{se.nom || se.type}</div>
                                                        </div>
                                                        <span style={getStatusBadgeStyle(se.statut)}>
                                                            {se.statut}
                                                        </span>
                                                    </div>
                                                    {(se.superficie || se.capacite) && (
                                                        <div style={styles.subCardMeta}>
                                                            {se.superficie && <span>📐 {se.superficie}m²</span>}
                                                            {se.capacite && <span>👥 {se.capacite} pers.</span>}
                                                        </div>
                                                    )}
                                                    <div style={styles.subCardActions}>
                                                        <button 
                                                            onClick={() => { setQrCodeData({ valeur: se.id.toString(), titre: se.numero }); setShowQRModal(true); }} 
                                                            style={styles.miniBtn}
                                                            title="QR Code"
                                                        >
                                                            <QrCode style={{fontSize: '16px'}} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setSelectedSousEspace(se); setSousEspaceForm(se); setShowSousEspaceModal(true); }} 
                                                            style={styles.miniBtn}
                                                            title="Modifier"
                                                        >
                                                            <Edit style={{fontSize: '16px'}} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <CategorieModal 
                show={showCategorieModal} 
                onClose={() => setShowCategorieModal(false)} 
                onSuccess={loadAllData}
            />

            {/* === MODALE QR CODE === */}
            {showQRModal && (
                <div style={styles.overlay} onClick={() => setShowQRModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>Imprimer le QR Code</h2>
                            <button onClick={() => setShowQRModal(false)} style={styles.closeBtn}>
                                <Close />
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            <QRCodePrinter valeur={qrCodeData.valeur} titre={qrCodeData.titre} />
                        </div>
                    </div>
                </div>
            )}

            {/* === MODALE ESPACE PARENT === */}
            {showEspaceModal && (
                <div style={styles.overlay} onClick={() => setShowEspaceModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>{selectedEspace ? 'Modifier l\'espace' : 'Nouvel espace parent'}</h2>
                            <button onClick={() => setShowEspaceModal(false)} style={styles.closeBtn}>
                                <Close />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitEspace} style={styles.form}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nom de l'espace *</label>
                                <input 
                                    placeholder="ex: Étage 1, Bâtiment A" 
                                    value={espaceForm.nom} 
                                    onChange={e => setEspaceForm({ ...espaceForm, nom: e.target.value })} 
                                    required 
                                    style={styles.input} 
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Identifiant / Numéro</label>
                                <input 
                                    placeholder="ex: RDC, E1" 
                                    value={espaceForm.numero} 
                                    onChange={e => setEspaceForm({ ...espaceForm, numero: e.target.value })} 
                                    style={styles.input} 
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Catégorie *</label>
                                <select 
                                    value={espaceForm.categorieId} 
                                    onChange={e => setEspaceForm({ ...espaceForm, categorieId: e.target.value })} 
                                    required 
                                    style={styles.select}
                                >
                                    <option value="">Choisir une catégorie</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                style={isSubmitting ? {...styles.btnSubmit, ...styles.btnSubmitDisabled} : styles.btnSubmit}
                            >
                                {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'espace'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* === MODALE SOUS-ESPACE === */}
            {showSousEspaceModal && (
                <div style={styles.overlay} onClick={() => { setShowSousEspaceModal(false); resetForms(); }}>
                    <div style={{...styles.modal, maxWidth: '600px'}} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>{selectedSousEspace ? 'Modifier le sous-espace' : 'Nouveau sous-espace'}</h2>
                            <button onClick={() => { setShowSousEspaceModal(false); resetForms(); }} style={styles.closeBtn}>
                                <Close />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitSousEspace} style={styles.form}>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Numéro / Code *</label>
                                    <input 
                                        placeholder="ex: 101" 
                                        value={sousEspaceForm.numero} 
                                        onChange={e => setSousEspaceForm({ ...sousEspaceForm, numero: e.target.value })} 
                                        required 
                                        style={styles.input} 
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Nom descriptif</label>
                                    <input 
                                        placeholder="ex: Suite Ambre" 
                                        value={sousEspaceForm.nom} 
                                        onChange={e => setSousEspaceForm({ ...sousEspaceForm, nom: e.target.value })} 
                                        style={styles.input} 
                                    />
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Type</label>
                                    <select 
                                        value={sousEspaceForm.type} 
                                        onChange={e => setSousEspaceForm({ ...sousEspaceForm, type: e.target.value })} 
                                        style={styles.select}
                                    >
                                        <option value="chambre">🛏️ Chambre</option>
                                        <option value="suite">✨ Suite</option>
                                        <option value="toilette">🚽 Toilette</option>
                                        <option value="cuisine">🍳 Cuisine</option>
                                        <option value="couloir">🚪 Couloir</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Statut initial</label>
                                    <select 
                                        value={sousEspaceForm.statut} 
                                        onChange={e => setSousEspaceForm({ ...sousEspaceForm, statut: e.target.value })} 
                                        style={styles.select}
                                    >
                                        <option value="libre">✅ Libre</option>
                                        <option value="occupe">🔴 Occupé</option>
                                        <option value="maintenance">🔧 Maintenance</option>
                                        <option value="nettoyage">🧹 À nettoyer</option>
                                    </select>
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Superficie (m²)</label>
                                    <input 
                                        type="number" 
                                        placeholder="ex: 25" 
                                        value={sousEspaceForm.superficie} 
                                        onChange={e => setSousEspaceForm({ ...sousEspaceForm, superficie: e.target.value })} 
                                        style={styles.input} 
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Capacité (pers.)</label>
                                    <input 
                                        type="number" 
                                        placeholder="ex: 2" 
                                        value={sousEspaceForm.capacite} 
                                        onChange={e => setSousEspaceForm({ ...sousEspaceForm, capacite: e.target.value })} 
                                        style={styles.input} 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                style={isSubmitting ? {...styles.btnSubmitSecondary, ...styles.btnSubmitDisabled} : styles.btnSubmitSecondary}
                            >
                                {isSubmitting ? 'Enregistrement...' : 'Valider le sous-espace'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// === STYLES PROFESSIONNELS AMÉLIORÉS ===

const getStatusBadgeStyle = (statut) => {
    const baseStyle = {
        fontSize: '11px',
        fontWeight: '600',
        padding: '4px 10px',
        borderRadius: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'inline-block'
    };

    const variants = {
        'libre': { backgroundColor: '#D1FAE5', color: '#065F46' },
        'occupe': { backgroundColor: '#FEE2E2', color: '#991B1B' },
        'maintenance': { backgroundColor: '#FEF3C7', color: '#92400E' },
        'nettoyage': { backgroundColor: '#DBEAFE', color: '#1E40AF' }
    };

    return { ...baseStyle, ...(variants[statut] || variants.libre) };
};

const styles = {
    // Container principal
    container: {
        padding: '32px',
        background: 'linear-gradient(135deg, #FBBF24 0%, #cb9b23 100%)',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },

    // Header
    header: {
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 8px 0',
        letterSpacing: '-0.5px'
    },
    subtitle: {
        fontSize: '14px',
        color: '#6B7280',
        margin: 0,
        fontWeight: '400'
    },

    // Stats
    statsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
    },
    statCard: {
        background: '#FFFFFF',
        padding: '24px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #F3F4F6',
        transition: 'all 0.3s ease',
        cursor: 'default'
    },
    statCardBlue: {
        borderLeft: '4px solid #3B82F6'
    },
    statCardGreen: {
        borderLeft: '4px solid #10B981'
    },
    statCardYellow: {
        borderLeft: '4px solid #F59E0B'
    },
    statIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6B7280'
    },
    statNumber: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 4px 0'
    },
    statLabel: {
        fontSize: '13px',
        color: '#6B7280',
        margin: 0,
        fontWeight: '500'
    },

    // Toolbar
    toolbar: {
        background: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: '16px',
        display: 'flex',
        gap: '20px',
        marginBottom: '28px',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #F3F4F6'
    },
    toolbarLeft: {
        display: 'flex',
        gap: '12px'
    },
    toolbarRight: {
        display: 'flex',
        gap: '12px',
        flex: 1,
        justifyContent: 'flex-end',
        minWidth: '300px'
    },

    // Buttons
    btnPrimary: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
    },
    btnSecondary: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
    },

    // Search
    searchWrapper: {
        position: 'relative',
        flex: 1,
        maxWidth: '400px'
    },
    searchIcon: {
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9CA3AF',
        fontSize: '20px',
        pointerEvents: 'none'
    },
    searchInput: {
        width: '100%',
        padding: '12px 16px 12px 44px',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s ease',
        backgroundColor: '#F9FAFB'
    },
    select: {
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        cursor: 'pointer',
        outline: 'none',
        backgroundColor: '#F9FAFB',
        minWidth: '180px',
        transition: 'all 0.2s ease'
    },

    // Liste
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    
    // Empty state
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '2px dashed #E5E7EB'
    },
    emptyText: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 8px 0'
    },
    emptySubtext: {
        fontSize: '14px',
        color: '#9CA3AF',
        margin: 0
    },

    // Cards
    card: {
        background: '#FFFFFF',
        borderRadius: '16px',
        borderLeft: '5px solid',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        border: '1px solid #F3F4F6'
    },
    cardHeader: {
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
    },
    cardHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flex: 1
    },
    cardIcon: {
        fontSize: '28px',
        display: 'flex',
        alignItems: 'center'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 6px 0'
    },
    cardSubtitle: {
        fontSize: '15px',
        fontWeight: '400',
        color: '#6B7280',
        marginLeft: '8px'
    },
    badge: {
        fontSize: '12px',
        fontWeight: '500',
        padding: '4px 12px',
        borderRadius: '12px',
        display: 'inline-block'
    },
    cardActions: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    actionBtn: {
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        color: '#6B7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        minWidth: '36px',
        minHeight: '36px'
    },
    actionBtnDanger: {
        color: '#EF4444'
    },
    expandBtn: {
        background: '#F3F4F6',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        fontWeight: '600',
        fontSize: '12px'
    },
    childCount: {
        fontSize: '12px',
        fontWeight: '600'
    },

    // Expanded content
    expandedContent: {
        padding: '20px 24px 24px',
        background: 'linear-gradient(to bottom, #F9FAFB 0%, #FFFFFF 100%)',
        borderTop: '1px solid #F3F4F6'
    },
    subGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
    },
    subCard: {
        padding: '18px',
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    subCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
        gap: '12px'
    },
    subCardNumber: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '4px'
    },
    subCardName: {
        fontSize: '13px',
        color: '#6B7280',
        fontWeight: '500'
    },
    subCardMeta: {
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: '#6B7280',
        marginBottom: '12px',
        paddingTop: '8px',
        borderTop: '1px solid #F3F4F6'
    },
    subCardActions: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
        paddingTop: '8px',
        borderTop: '1px solid #F3F4F6'
    },
    miniBtn: {
        padding: '6px 10px',
        borderRadius: '6px',
        border: '1px solid #E5E7EB',
        cursor: 'pointer',
        background: '#F9FAFB',
        color: '#6B7280',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease'
    },

    // Modal
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
        padding: '20px',
        animation: 'fadeIn 0.2s ease'
    },
    modal: {
        background: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease'
    },
    modalHeader: {
        padding: '24px 28px',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: '#FFFFFF',
        zIndex: 1,
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px'
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#111827',
        margin: 0
    },
    closeBtn: {
        background: '#F3F4F6',
        border: 'none',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        color: '#6B7280',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease'
    },
    modalBody: {
        padding: '24px 28px'
    },

    // Form
    form: {
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '4px'
    },
    input: {
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s ease',
        backgroundColor: '#F9FAFB',
        color: '#111827'
    },
    btnSubmit: {
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '15px',
        cursor: 'pointer',
        marginTop: '8px',
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
        transition: 'all 0.2s ease'
    },
    btnSubmitSecondary: {
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '15px',
        cursor: 'pointer',
        marginTop: '8px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        transition: 'all 0.2s ease'
    },
    btnSubmitDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
        boxShadow: 'none'
    },

    // Loading
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '20px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#F59E0B'
    },
    loadingSpinner: {
        width: '48px',
        height: '48px',
        border: '4px solid #F3F4F6',
        borderTop: '4px solid #F59E0B',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }
};

export default GestionEspacesHierarchie;