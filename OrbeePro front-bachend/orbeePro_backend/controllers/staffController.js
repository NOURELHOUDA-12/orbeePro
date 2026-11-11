const db = require('../config/db'); 
const bcrypt = require('bcrypt');
const nodemailer  = require('nodemailer');
const crypto      = require('crypto');

// ── Config email ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const toDateOnly = (d) => {
  if (!d) return null;
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};


exports.getAgents = async (req, res) => {
    try {
        const sql = "SELECT id, nom, specialite, role FROM staff";
        const [rows] = await db.query(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// exports.getUserById = async (req, res) => {
//     const { userId } = req.params; 
    
//     try {
//         const [rows] = await db.query("SELECT * FROM staff WHERE id = ?", [userId]);


//         res.json({ success: true, data: rows[0] });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };


exports.getUserById = async (req, res) => {
    const { userId } = req.params; 
    try {
        const [rows] = await db.query("SELECT * FROM staff WHERE id = ?", [userId]);
        if (rows.length === 0) {
          return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
        }
        const user = { ...rows[0] };
        delete user.password;                          // voir bug sécurité plus bas
        user.date_naissance = toDateOnly(user.date_naissance);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};



exports.putStaff = async (req, res) => {

 
  const { id } = req.params;
  const { name, role, tel, specialite } = req.body;

  try {



    // 1. Découpage du nom
    const nameParts = name.trim().split(' ');
    const nom = nameParts[0] || '';
    const prenom = nameParts.slice(1).join(' ') || '';

    // 2. Logique de l'image :
    // Si req.file existe, l'utilisateur a chargé une NOUVELLE image.
    // Sinon, on garde l'ancienne image (si elle est passée dans le body) ou null.
    let imageToSave = null;
    if (req.file) {
  imageToSave = `/uploads/staff/${req.file.filename}`;
    } else if (req.body.profileImageUrl) {
      imageToSave = req.body.profileImageUrl; // On garde l'existante si pas de changement
    }

    const [result] = await db.query(
      `UPDATE staff 
       SET nom = ?, prenom = ?, role = ?, tel = ?, specialite = ?, profileImage = ?
       WHERE id = ?`,
      [
        nom,
        prenom,
        role,
        tel || null,
        role === 'maintenance' ? specialite : null,
        imageToSave, // On utilise la variable traitée ici
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Membre non trouvé' });
    }

    res.json({ success: true, message: `${name} mis à jour !` });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};



exports.deleteStaff = async (req, res) => {
     const { id } = req.params;
    
      try {
        // Récupérer le nom avant suppression
        const [staff] = await db.query(
          `SELECT CONCAT(nom, ' ', IFNULL(prenom, '')) as name FROM staff WHERE id = ?`, 
          [id]

        );
        
        if (staff.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Membre non trouvé' 
          });
        }
           
            
 // Supprimer
        await db.query('DELETE FROM staff WHERE id = ?', [id]);
        
        res.json({ 
          success: true, 
          message: `${staff[0].name} a été supprimé avec succès` 
        });
      } catch (error) {
        console.error('❌ Erreur suppression staff:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Erreur lors de la suppression' 
        });
      }
    };



// ── Ajout d'un membre staff ───────────────────────────────────────────────────
exports.addNewStaff = async (req, res) => {
  const { username, nom, prenom, dateNaissance,email, password, tel, role, specialite } = req.body;

  try {
    // 1. Validation champs obligatoires
    if (!username || !nom || !email || !password || !role || !dateNaissance) {
      return res.status(400).json({
        success: false,
        message: 'Username, nom, email, mot de passe, rôle et date de naissance sont obligatoires',
      });
    }

    // 2. Vérification username unique
    const [existingUsername] = await db.query(
      'SELECT id FROM staff WHERE username = ?', [username]
    );
    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà pris',
      });
    }

    // 3. Vérification email unique
    const [existingEmail] = await db.query(
      'SELECT id FROM staff WHERE email = ?', [email]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
    }

    // 4. Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Token de validation email
    const validationToken   = crypto.randomBytes(32).toString('hex');
    const tokenExpiration   = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // 6. Photo de profil
    const profileImage = req.file
      ? `/uploads/staff/${req.file.filename}`
      : null;

    // 7. Insertion en base
    const fullName = `${nom} ${prenom || ''}`.trim();
    const [result] = await db.query(
      `INSERT INTO staff
        (username, nom, prenom, date_naissance,  email, password, tel, role, specialite,
         profileImage, validation_token, token_expiration, is_validated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, 0)`,
      [
        username,
        nom,
        prenom  || null,
        dateNaissance|| null ,
        email,
        hashedPassword,
        tel     || null,
        role,
        specialite || null,
        profileImage,
        validationToken,
        tokenExpiration,
        
      ]
    );

    // 8. Envoi email de validation
    const validationUrl = `${process.env.API_URL}/api/staff/validate/${validationToken}`;

    const roleLabels = {
      receptionniste:   'Réceptionniste',
      menage:           'Ménage',
      maintenance:      'Maintenance',
      'chef-maintenance': 'Chef Maintenance',
      admin:            'Administrateur',
    };

    await transporter.sendMail({
      from:    `"OrbeePro" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: '✅ Validation de votre compte OrbeePro',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9fafb;padding:20px;border-radius:16px">

          <div style="background:#3B82F6;padding:28px;border-radius:12px;text-align:center;margin-bottom:24px">
            <h1 style="color:white;margin:0;font-size:24px">🐝 OrbeePro</h1>
            <p style="color:#BFDBFE;margin:8px 0 0;font-size:14px">Système de gestion des espaces</p>
          </div>

          <div style="background:white;padding:28px;border-radius:12px;border:1px solid #E5E7EB">
            <h2 style="color:#1F2937;margin:0 0 8px">Bienvenue, ${nom} ${prenom || ''} ! 👋</h2>
            <p style="color:#6B7280;margin:0 0 24px;font-size:14px">
              Votre compte a été créé avec succès. Veuillez valider votre adresse email pour accéder à l'application.
            </p>

            <!-- Infos du compte -->
            <div style="background:#F3F4F6;border-radius:10px;padding:16px;margin-bottom:24px">
              <h3 style="color:#374151;margin:0 0 12px;font-size:14px;font-weight:600">
                📋 Vos informations de connexion
              </h3>
              <table style="width:100%;font-size:14px">
                <tr>
                  <td style="color:#6B7280;padding:4px 0;width:40%">Nom d'utilisateur</td>
                  <td style="color:#1F2937;font-weight:600">@${username}</td>
                </tr>
                <tr>
                  <td style="color:#6B7280;padding:4px 0">Email</td>
                  <td style="color:#1F2937;font-weight:600">${email}</td>
                </tr>
                <tr>
                  <td style="color:#6B7280;padding:4px 0">Rôle</td>
                  <td style="color:#1F2937;font-weight:600">${roleLabels[role] || role}</td>
                </tr>
                ${specialite ? `
                <tr>
                  <td style="color:#6B7280;padding:4px 0">Spécialité</td>
                  <td style="color:#1F2937;font-weight:600">${specialite}</td>
                </tr>` : ''}
              </table>
            </div>

            <!-- Bouton validation -->
            <div style="text-align:center;margin-bottom:24px">
              <a href="${validationUrl}"
                 style="display:inline-block;background:#3B82F6;color:white;padding:14px 32px;
                        border-radius:10px;text-decoration:none;font-weight:600;font-size:16px">
                ✅ Valider mon compte
              </a>
            </div>

            <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:12px;margin-bottom:16px">
              <p style="color:#92400E;margin:0;font-size:13px">
                ⚠️ Ce lien expire dans <strong>24 heures</strong>.
                Après expiration, contactez votre administrateur.
              </p>
            </div>

            <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0">
              Si vous n'êtes pas à l'origine de ce compte, ignorez cet email.
            </p>
          </div>

          <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:16px">
            © ${new Date().getFullYear()} OrbeePro — Tous droits réservés
          </p>
        </div>
      `,
    });

    console.log(`✅ Staff créé: ${username} | Email envoyé à: ${email}`);

    res.status(201).json({
      success: true,
      message: `Compte créé ! Un email de validation a été envoyé à ${email}`,
      data: {
        id:       result.insertId,
        username,
        nom,
        prenom,
        email,
        role,
      },
    });

  } catch (error) {
    console.error('❌ addNewStaff error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Validation du compte via le lien email ────────────────────────────────────
exports.validateAccount = async (req, res) => {
  const { token } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT id, nom, prenom, email, token_expiration, is_validated
       FROM staff WHERE validation_token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).send(`
        <html><body style="font-family:Arial;text-align:center;padding:60px">
          <h2 style="color:#EF4444">❌ Lien invalide</h2>
          <p>Ce lien de validation n'existe pas.</p>
        </body></html>
      `);
    }

    const staff = rows[0];

    // Déjà validé
    if (staff.is_validated) {
      return res.send(`
        <html><body style="font-family:Arial;text-align:center;padding:60px">
          <h2 style="color:#10B981">✅ Compte déjà validé</h2>
          <p>Votre compte est déjà actif. Vous pouvez vous connecter.</p>
        </body></html>
      `);
    }

    // Token expiré
    if (new Date() > new Date(staff.token_expiration)) {
      return res.status(400).send(`
        <html><body style="font-family:Arial;text-align:center;padding:60px">
          <h2 style="color:#F59E0B">⏰ Lien expiré</h2>
          <p>Ce lien a expiré. Contactez votre administrateur.</p>
        </body></html>
      `);
    }

    // Valider le compte
    await db.query(
      `UPDATE staff
       SET is_validated = 1, validation_token = NULL, token_expiration = NULL
       WHERE id = ?`,
      [staff.id]
    );

    console.log(`✅ Compte validé: ${staff.email}`);

    res.send(`
      <html>
      <body style="font-family:Arial,sans-serif;background:#F9FAFB;display:flex;
                   align-items:center;justify-content:center;min-height:100vh;margin:0">
        <div style="background:white;padding:40px;border-radius:16px;text-align:center;
                    max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
          <div style="background:#D1FAE5;width:80px;height:80px;border-radius:40px;
                      display:flex;align-items:center;justify-content:center;
                      margin:0 auto 20px;font-size:40px">
            ✅
          </div>
          <h2 style="color:#10B981;margin:0 0 8px">Compte validé !</h2>
          <p style="color:#6B7280;margin:0 0 24px">
            Bienvenue ${staff.nom} ${staff.prenom || ''} !<br>
            Votre compte est maintenant actif.
          </p>
          <p style="color:#9CA3AF;font-size:13px">
            Vous pouvez maintenant vous connecter à l'application OrbeePro.
          </p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ validateAccount error:', error);
    res.status(500).send('Erreur serveur');
  }
};

// ── Renvoyer l'email de validation ────────────────────────────────────────────
exports.resendValidation = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM staff WHERE email = ?', [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Email introuvable' });
    }

    const staff = rows[0];

    if (staff.is_validated) {
      return res.status(400).json({ success: false, message: 'Compte déjà validé' });
    }

    // Nouveau token
    const newToken      = crypto.randomBytes(32).toString('hex');
    const newExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      'UPDATE staff SET validation_token = ?, token_expiration = ? WHERE id = ?',
      [newToken, newExpiration, staff.id]
    );

    const validationUrl = `${process.env.API_URL}/api/staff/validate/${newToken}`;

    await transporter.sendMail({
      from:    `"OrbeePro" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: '🔄 Nouveau lien de validation — OrbeePro',
      html: `
        <div style="font-family:Arial;max-width:500px;margin:auto;padding:20px">
          <h2>Nouveau lien de validation</h2>
          <p>Bonjour ${staff.nom},</p>
          <p>Voici votre nouveau lien de validation :</p>
          <a href="${validationUrl}"
             style="display:inline-block;background:#3B82F6;color:white;
                    padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            ✅ Valider mon compte
          </a>
          <p style="color:#9CA3AF;font-size:12px;margin-top:16px">
            Ce lien expire dans 24 heures.
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Email de validation renvoyé avec succès' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── getAllStaff ────────────────────────────────────────────────────────────────
exports.getAllStaff = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id, username, nom, prenom,
         CONCAT(nom, ' ', IFNULL(prenom, '')) AS name,
         email, role, tel, specialite,
         profileImage AS profileImageUrl,
         is_validated,
         created_at AS createdAt
       FROM staff
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
    console.log('✅ Staff récupéré:', rows.length, 'membres');
  } catch (error) {
    console.error('❌ getAllStaff error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};



// ── Admin modifie n'importe quel staff ────────────────────────────────────────

exports.updateStaffById = async (req, res) => {
  const { id } = req.params;
  console.log(id, 'updateStaffById called with body:', req.body);
  const requesterId = req.user?.id;

  console.log(`📝 updateStaffById — admin:${requesterId} modifie staff:${id}`);

  try {
    // 1. Récupérer le user cible
    const [rows] = await db.query('SELECT * FROM staff WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }
    const current = rows[0];

    const {
      username, nom, prenom, email, tel, dateNaissance, role, specialite, newPassword, 
    } = req.body;


    // 2. Vérif username unique
    if (username && username !== current.username) {
      const [ex] = await db.query(
        'SELECT id FROM staff WHERE username = ? AND id != ?', [username, id]
      );
      if (ex.length > 0) {
        return res.status(409).json({ success: false, message: 'Username déjà pris' });
      }
    }

    // 3. Vérif email unique
    if (email && email !== current.email) {
      const [ex] = await db.query(
        'SELECT id FROM staff WHERE email = ? AND id != ?', [email, id]
      );
      if (ex.length > 0) {
        return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
      }
    }

   
    // 4. Mot de passe
    let hashedPassword = current.password;
    if (newPassword && newPassword.length >= 6) {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // 5. Photo
    let profileImage = current.profileImage;
    if (req.file) {
      profileImage = `/uploads/staff/${req.file.filename}`;
    }

    // 6. Update
    const fullName = `${nom || current.nom} ${prenom || current.prenom || ''}`.trim();

    await db.query(
      `UPDATE staff SET
        username        = ?,
        nom             = ?,
        prenom          = ?,
        email           = ?,
        tel             = ?,
        date_naissance  = ?,
        role            = ?,
        specialite      = ?,
        password        = ?,
        profileImage    = ?
       WHERE id = ?` ,
      [
        username        || current.username,
        nom             || current.nom,
        prenom          !== undefined ? prenom : current.prenom,
        email           || current.email,
        tel             !== undefined ? tel    : current.tel,
    dateNaissance ? toDateOnly(dateNaissance) : current.date_naissance,  
        role            || current.role,
        specialite      !== undefined ? specialite : current.specialite,
        hashedPassword,
        profileImage,
        id
      ]
    );

    // 7. Retour
    const [updated] = await db.query(
      `SELECT id, username, nom, prenom,  email, tel,
              role, specialite, profileImage AS profileImageUrl,
              date_naissance AS dateNaissance,
             is_validated, created_at AS createdAt
       FROM staff WHERE id = ?`,
      [id]
    );

    console.log(`✅ Staff mis à jour par admin: ${updated[0].username}`);

    res.json({
      success: true,
      message: 'Membre mis à jour avec succès',
      data:    updated[0],
    });

  } catch (error) {
    console.error('❌ updateStaffById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }


     
};