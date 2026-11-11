const Staff = require('../Models/Staff');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * LOGIQUE D'INSCRIPTION (REGISTER)
 */
exports.register = async (req, res) => {
    try {
        const { email, password, nom, prenom, tel } = req.body;
        
        // req.file est rempli par le middleware Multer dans la route
        const profileImage = req.file ? req.file.filename : null;

        // 1. Vérification si l'utilisateur existe déjà
        const existingUser = await Staff.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }

        // 2. Hachage du mot de passe
        // On ne stocke jamais le mot de passe en clair dans MySQL
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Création dans la base de données via le Modèle
        await Staff.create({
            email,
            password: hashedPassword,
            nom,
            prenom,
            tel,
            profileImage
        });

        res.status(201).json({ message: "Utilisateur créé avec succès !" });

    } catch (error) {
        // C'est ici que vous verrez l'erreur réelle dans votre terminal Node.js
        console.error("❌ ERREUR LORS DE L'INSCRIPTION :", error);
        res.status(500).json({ 
            error: "Erreur interne du serveur lors de l'inscription.",
            details: error.message 
        });
    }
};

/**
 * LOGIQUE DE CONNEXION (LOGIN)
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Chercher l'utilisateur par son email
        const user = await Staff.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        // 2. Comparer le mot de passe saisi avec le hash dans MySQL
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        // 3. Création du Token JWT si tout est correct
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );


        // 4. Réponse au client (React)
        res.json({
            message: "Connexion réussie",
            token,
            role: user.role,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                profileImage: user.profileImage,
                role:user.role
            }
        });

    } catch (error) {
        console.error("❌ ERREUR LORS DE LA CONNEXION :", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion." });
    }
    
};


