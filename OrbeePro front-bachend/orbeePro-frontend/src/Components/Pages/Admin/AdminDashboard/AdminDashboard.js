import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";

import reclamationService from "../../../../services/ReclamationService";
import tachesService from "../../../../services/taskService";

import styles from "./Dashboard.module.css";

// ─────────────────────────────────────────────
// Palette de couleurs
// ─────────────────────────────────────────────
const C = {
  red:     "#E24B4A",
  darkRed: "#A32D2D",
  amber:   "#EF9F27",
  blue:    "#378ADD",
  green:   "#639922",
  coral:   "#D85A30",
  gray:    "#888780",
};

const RECLAM_STATUS_COLORS  = [C.red, C.amber, C.blue, C.green];
const TACHES_STATUS_COLORS  = [C.blue, C.red, C.green];
const PRIORITY_COLORS       = [C.darkRed, C.red, C.amber, C.green];
const AGE_BUCKET_ORDER      = ["1–3 j", "4–7 j", "8–15 j", "16–30 j", "> 30 j"];
const AGE_BUCKET_COLORS     = [C.green, C.amber, C.coral, C.red, C.darkRed];

// ─────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────
const isLate = (dateEcheance) =>
  dateEcheance ? new Date(dateEcheance) < new Date() : false;

const ageInDays = (dateCreation) =>
  dateCreation
    ? Math.floor((Date.now() - new Date(dateCreation)) / 86_400_000)
    : 0;

const ageBucket = (days) => {
  if (days <= 3)  return "1–3 j";
  if (days <= 7)  return "4–7 j";
  if (days <= 15) return "8–15 j";
  if (days <= 30) return "16–30 j";
  return "> 30 j";
};

const field = (...keys) => (obj) => {
  for (const k of keys) if (obj?.[k] != null && obj[k] !== "") return obj[k];
  return "—";
};

// Vérifie le statut dans les champs statut / status / etat (insensible à la casse)
const statusMatch = (obj, ...values) => {
  const val = (obj?.statut ?? obj?.status ?? obj?.etat ?? "").toLowerCase().trim();
  return values.some((v) => v.toLowerCase().trim() === val);
};

// Vérifie l'urgence dans les champs urgency / urgence / priorite / priority
const urgencyMatch = (obj, ...values) => {
  const val = (obj?.urgency ?? obj?.urgence ?? obj?.priorite ?? obj?.priority ?? "").toLowerCase().trim();
  return values.some((v) => v.toLowerCase().trim() === val);
};

// ─────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────

/** Carte KPI */
const KpiCard = ({ label, value, color, sub }) => (
  <div className={styles.kpiCard}>
    <p className={styles.kpiLabel}>{label}</p>
    <p className={styles.kpiValue} style={{ color }}>{value}</p>
    {sub && <p className={styles.kpiSub} style={{ color }}>{sub}</p>}
  </div>
);

/** En-tête de graphique */
const ChartHeader = ({ title, sub }) => (
  <>
    <p className={styles.chartTitle}>{title}</p>
    {sub && <p className={styles.chartSub}>{sub}</p>}
  </>
);

/** Légende manuelle */
const ChartLegend = ({ items }) => (
  <div className={styles.legend}>
    {items.map(({ color, label }) => (
      <span key={label} className={styles.legendItem}>
        <span className={styles.legendDot} style={{ background: color }} />
        {label}
      </span>
    ))}
  </div>
);

/** Tooltip personnalisé Recharts */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label && <p className={styles.tooltipLabel}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className={styles.tooltipRow} style={{ color: p.color ?? C.gray }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/** Badge urgence/priorité — supporte FR et EN */
const Badge = ({ label = "" }) => {
  const key = label.toLowerCase();
  const cls =
    key === "critical" || key.includes("critique")  ? styles.badgeCritique :
    key === "high"     || key.includes("haute")     ? styles.badgeHaute    :
    key === "medium"   || key.includes("moyenne")   ? styles.badgeMoyenne  :
    key === "low"      || key.includes("basse")     ? styles.badgeBasse    :
                                                       styles.badgeDefault;
  return <span className={`${styles.badge} ${cls}`}>{label || "—"}</span>;
};

/** Icône SVG inline */
const IconDoc = () => (
  <svg className={styles.btnIcon} xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12h6m-6 4h6M5 8h14M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconTask = () => (
  <svg className={styles.btnIcon} xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

// ─────────────────────────────────────────────
// Dashboard principal
// ─────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  const [reclamations, setReclamations] = useState([]);
  const [taches, setTaches]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // ── Chargement des données ──────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // reclamationService.getAll() retourne directement le JSON de l'API
        // On lance les deux appels en parallèle
        const reclamRes = await reclamationService.getAll();

        // Pour tachesService, adaptez le nom de la méthode si nécessaire
        let tachesRes = [];
        try {
          tachesRes = await tachesService.getAll();
        } catch (tachErr) {
          // Si le service tâches n'est pas encore prêt, on continue sans planter
          console.warn("[Dashboard] tachesService non disponible :", tachErr.message);
        }

        // Supporte réponse directe (tableau) ou enveloppée ({ data: [...] })
        setReclamations(Array.isArray(reclamRes) ? reclamRes : reclamRes?.data ?? []);
        setTaches(Array.isArray(tachesRes) ? tachesRes : tachesRes?.data ?? []);
      } catch (err) {
        console.error("[Dashboard] Erreur de chargement :", err);
        setError("Impossible de charger les données. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── Stats réclamations ──────────────────────
  // isLate se base sur dateEcheance — si votre API n'a pas ce champ,
  // les réclamations "en retard" seront celles avec statut explicite
  const reclamEnRetard     = reclamations.filter((r) =>
    isLate(r.dateEcheance) || statusMatch(r, "en_retard", "retard", "late", "LATE")
  );
  const reclamEnAttente    = reclamations.filter((r) =>
    statusMatch(r, "en_attente", "attente", "pending", "PENDING", "ouvert", "ouvert", "open")
  );
  const reclamEnTraitement = reclamations.filter((r) =>
    statusMatch(r, "en_traitement", "en cours", "in_progress", "IN_PROGRESS", "assigned", "affecte")
  );
  const reclamResolues     = reclamations.filter((r) =>
    statusMatch(r, "resolue", "resolu", "resolved", "RESOLVED", "done", "DONE", "fermé", "ferme", "closed")
  );

  const tauxResolution = reclamations.length
    ? Math.round((reclamResolues.length / reclamations.length) * 100)
    : 0;

  const pieReclamData = [
    { name: "En retard",     value: reclamEnRetard.length     },
    { name: "En attente",    value: reclamEnAttente.length    },
    { name: "En traitement", value: reclamEnTraitement.length },
    { name: "Résolues",      value: reclamResolues.length     },
  ];

  // ── Stats tâches ────────────────────────────
  const tachesEnCours   = taches.filter((t) => statusMatch(t, "en_cours",  "En cours",  "IN_PROGRESS"));
  const tachesEnRetard  = taches.filter((t) => isLate(t.dateEcheance) && !statusMatch(t, "terminee", "Terminée", "DONE"));
  const tachesTerminees = taches.filter((t) => statusMatch(t, "terminee",  "Terminée",  "DONE"));

  const donutTachesData = [
    { name: "En cours",  value: tachesEnCours.length   },
    { name: "En retard", value: tachesEnRetard.length  },
    { name: "Terminées", value: tachesTerminees.length },
  ];

  // ── Retards par service ─────────────────────
  const serviceMap = {};
  reclamEnRetard.forEach((r) => {
    const svc = r.service || r.departement || r.category || "Autre";
    serviceMap[svc] = (serviceMap[svc] || 0) + 1;
  });
  const barServiceData = Object.entries(serviceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ── Âge des réclamations en retard ──────────
  const ageMap = Object.fromEntries(AGE_BUCKET_ORDER.map((b) => [b, 0]));
  reclamEnRetard.forEach((r) => {
    const b = ageBucket(ageInDays(r.dateCreation || r.createdAt || r.created_at));
    ageMap[b]++;
  });
  const ageData = AGE_BUCKET_ORDER.map((name, i) => ({
    name, value: ageMap[name], fill: AGE_BUCKET_COLORS[i],
  }));

  // ── Priorité des tâches en retard ───────────
  const priorityMap = {};
  tachesEnRetard.forEach((t) => {
    const p = t.priorite || t.priority || t.niveau || "Moyenne";
    priorityMap[p] = (priorityMap[p] || 0) + 1;
  });
  const priorityData = Object.entries(priorityMap).map(([name, value]) => ({ name, value }));

  // ── Évolution hebdomadaire (7 semaines) ─────
  const weeks = Array.from({ length: 7 }, (_, i) => ({
    name: `S${i + 1}`, recues: 0, resolues: 0,
  }));
  const now = Date.now();

  reclamations.forEach((r) => {
    const created = new Date(r.dateCreation || r.createdAt || r.created_at);
    const diffW = Math.floor((now - created) / (7 * 86_400_000));
    if (diffW >= 0 && diffW < 7) weeks[6 - diffW].recues++;

    if (statusMatch(r, "resolue", "Résolue", "DONE", "RESOLVED")) {
      const resolved = new Date(r.dateResolution || r.updatedAt || r.updated_at);
      const diffWr = Math.floor((now - resolved) / (7 * 86_400_000));
      if (diffWr >= 0 && diffWr < 7) weeks[6 - diffWr].resolues++;
    }
  });

  // ── Top 5 réclamations critiques en retard ──
  const topCritiques = [...reclamEnRetard]
    .sort(
      (a, b) =>
        ageInDays(b.dateCreation || b.createdAt || b.created_at) -
        ageInDays(a.dateCreation || a.createdAt || a.created_at)
    )
    .slice(0, 5);

  // Accesseurs de champs — adaptés aux vrais champs de votre API :
  // { espaceNumber, service, urgency, description, photo, statut, ... }
  const getObjet    = field("description", "objet", "titre", "title");
  const getService  = field("service", "departement", "category");
  const getAssigne  = field("assigneA", "agent", "responsable", "assignee");
  // urgency est le champ de priorité dans votre API
  const getPriorite = field("urgency", "urgence", "priorite", "priority");

  // ── Rendu ───────────────────────────────────
  if (loading) {
    return (
      <div className={`${styles.stateBox} ${styles.stateLoading}`}>
        Chargement du tableau de bord…
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.stateBox} ${styles.stateError}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ────────── En-tête ────────── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Tableau de bord</h1>
          <p>Suivi des réclamations et des tâches</p>
        </div>

        <div className={styles.navButtons}>
          <button
            className={styles.btnReclam}
            onClick={() => navigate("/AdminReclamations")}
          >
            <IconDoc />
            Réclamations
          </button>
          <button
            className={styles.btnTaches}
            onClick={() => navigate("/TachesAdmin")}
          >
            <IconTask />
            Tâches
          </button>
        </div>
      </div>

      {/* ────────── KPIs ────────── */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Réclamations en retard"
          value={reclamEnRetard.length}
          color={C.red}
          sub="Dépassement d'échéance"
        />
        <KpiCard
          label="Tâches en cours"
          value={tachesEnCours.length}
          color={C.blue}
          sub={`Dont ${tachesEnRetard.length} en retard`}
        />
        <KpiCard
          label="Tâches en retard"
          value={tachesEnRetard.length}
          color={C.amber}
          sub="Échéance dépassée"
        />
        <KpiCard
          label="Taux de résolution"
          value={`${tauxResolution}%`}
          color={C.green}
          sub={`${reclamResolues.length} résolues / ${reclamations.length} total`}
        />
      </div>

      {/* ────────── Ligne 1 : Pie + Donut ────────── */}
      <div className={styles.chartsRow}>

        {/* Statut réclamations */}
        <div className={styles.chartCard}>
          <ChartHeader
            title="Statut des réclamations"
            sub="Distribution par état actuel"
          />
          <ChartLegend items={[
            { color: C.red,   label: `En retard (${reclamEnRetard.length})` },
            { color: C.amber, label: `En attente (${reclamEnAttente.length})` },
            { color: C.blue,  label: `En traitement (${reclamEnTraitement.length})` },
            { color: C.green, label: `Résolues (${reclamResolues.length})` },
          ]} />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieReclamData}
                cx="50%" cy="50%"
                outerRadius={85}
                dataKey="value"
                label={({ name, percent }) =>
                  percent > 0.05 ? `${Math.round(percent * 100)}%` : ""
                }
                labelLine={false}
              >
                {pieReclamData.map((_, i) => (
                  <Cell key={i} fill={RECLAM_STATUS_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Statut tâches */}
        <div className={styles.chartCard}>
          <ChartHeader
            title="Tâches par statut"
            sub="Répartition des tâches actives"
          />
          <ChartLegend items={[
            { color: C.blue,  label: `En cours (${tachesEnCours.length})` },
            { color: C.red,   label: `En retard (${tachesEnRetard.length})` },
            { color: C.green, label: `Terminées (${tachesTerminees.length})` },
          ]} />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={donutTachesData}
                cx="50%" cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                label={({ name, percent }) =>
                  percent > 0.05 ? `${Math.round(percent * 100)}%` : ""
                }
                labelLine={false}
              >
                {donutTachesData.map((_, i) => (
                  <Cell key={i} fill={TACHES_STATUS_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ────────── Ligne 2 : Courbe + Barres horizontales ────────── */}
      <div className={styles.chartsRow}>

        {/* Évolution hebdomadaire */}
        <div className={styles.chartCard}>
          <ChartHeader
            title="Évolution hebdomadaire"
            sub="Réclamations reçues vs résolues (7 semaines)"
          />
          <ChartLegend items={[
            { color: C.red,   label: "Reçues" },
            { color: C.green, label: "Résolues" },
          ]} />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeks} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="recues" name="Reçues"
                stroke={C.red}   strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="resolues" name="Résolues"
                stroke={C.green} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Retards par service */}
        <div className={styles.chartCard}>
          <ChartHeader
            title="Retards par service"
            sub="Nombre de réclamations en retard par service"
          />
          <ResponsiveContainer width="100%" height={Math.max(220, barServiceData.length * 42 + 40)}>
            <BarChart
              data={barServiceData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Retards" fill={C.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ────────── Ligne 3 : Âge + Priorité ────────── */}
      <div className={styles.chartsRow}>

        {/* Âge des réclamations en retard */}
        <div className={styles.chartCard}>
          <ChartHeader
            title="Âge des réclamations en retard"
            sub="Distribution par ancienneté (jours)"
          />
          <ChartLegend items={AGE_BUCKET_ORDER.map((name, i) => ({
            color: AGE_BUCKET_COLORS[i], label: name,
          }))} />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Réclamations" radius={[4, 4, 0, 0]}>
                {ageData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priorité des tâches en retard */}
        <div className={styles.chartCard}>
          <ChartHeader
            title="Priorité des tâches en retard"
            sub="Segmentation par niveau d'urgence"
          />
          {priorityData.length > 0 ? (
            <>
              <ChartLegend items={priorityData.map((d, i) => ({
                color: PRIORITY_COLORS[i % PRIORITY_COLORS.length],
                label: `${d.name} (${d.value})`,
              }))} />
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%" cy="50%"
                    outerRadius={78}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0.05 ? `${Math.round(percent * 100)}%` : ""
                    }
                    labelLine={false}
                  >
                    {priorityData.map((_, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[i % PRIORITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className={styles.empty}>Aucune tâche en retard</p>
          )}
        </div>
      </div>

      {/* ────────── Tableau réclamations critiques ────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderText}>
            <p className={styles.chartTitle}>Réclamations critiques en retard</p>
            <p className={styles.chartSub}>Classées par ancienneté décroissante</p>
          </div>
          <button
            className={styles.viewAllBtn}
            onClick={() => navigate("/AdminReclamations")}
          >
            Voir tout →
          </button>
        </div>

        {topCritiques.length === 0 ? (
          <p className={styles.empty}>Aucune réclamation en retard</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Service</th>
                  <th>Espace</th>
                  <th>Urgence</th>
                  <th>Assigné à</th>
                </tr>
              </thead>
              <tbody>
                {topCritiques.map((r, i) => (
                  <tr
                    key={r.id ?? r._id ?? i}
                    className={styles.tableRow}
                    onClick={() => navigate(`/reclamations/${r.id ?? r._id}`)}
                  >
                    <td className={styles.idCell}>#{r.id ?? r._id}</td>
                    <td>
                      <span className={styles.truncate} title={getObjet(r)}>
                        {getObjet(r)}
                      </span>
                    </td>
                    <td>{getService(r)}</td>
                    <td>{r.espaceNumber ?? "—"}</td>
                    <td><Badge label={getPriorite(r)} /></td>
                    <td>{getAssigne(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}