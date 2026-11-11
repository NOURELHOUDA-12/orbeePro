// helpers/activityLog.js

const db = require('../config/db');

/**
 * @param {object} params
 * @param {'reclamations'|'taches'|'personnel'|'fournisseurs'|'espaces'} params.module
 * @param {number}  params.moduleId
 * @param {'INSERT'|'UPDATE'|'DELETE'|'STATUS_CHANGE'|'ASSIGN'} params.action
 * @param {string}  [params.champModifie]
 * @param {any}     [params.ancienValeur]
 * @param {any}     [params.nouveauValeur]
 * @param {number}  params.faitPar
 * @param {string}  params.roleUser
 * @param {string}  [params.commentaire]
 */
async function logActivity({
  module,
  moduleId,
  action,
  champModifie  = null,
  ancienValeur  = null,
  nouveauValeur = null,
  faitPar,
  roleUser,
  commentaire   = null,
}) {
  await db.query(
    `INSERT INTO activity_logs
      (module, module_id, action, champ_modifie,
       ancien_valeur, nouveau_valeur, fait_par, role_user, commentaire)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      module,
      moduleId,
      action,
      champModifie,
      ancienValeur  !== null ? String(ancienValeur)  : null,
      nouveauValeur !== null ? String(nouveauValeur) : null,
      faitPar,
      roleUser,
      commentaire,
    ]
  );
}

module.exports = logActivity;