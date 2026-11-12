# OrbeePro Backend

Backend Node.js / Express pour l’application OrbeePro.

## Prérequis

Avant de lancer le projet, assurez-vous d’avoir installé :

* Node.js
* npm
* MySQL ou MariaDB
* Un serveur SMTP valide pour l’envoi des emails

## Installation

Cloner le dépôt :

```bash
git clone <URL_DU_REPOSITORY>
cd orbeePro_backend
```

Installer les dépendances :

```bash
npm install
```

## Configuration de l’environnement

Créer un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Puis modifier les valeurs selon votre environnement.

Exemple de configuration :

```env
# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=example@mail.example
SMTP_PASS=your_smtp_password

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=""
DB_NAME=orbeepro

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
```

## Variables d’environnement

| Variable      | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `SMTP_HOST`   | Adresse du serveur SMTP                                      |
| `SMTP_PORT`   | Port SMTP utilisé, par exemple `465` ou `587`                |
| `SMTP_SECURE` | `true` pour SSL/TLS, généralement avec le port `465`         |
| `SMTP_USER`   | Adresse email utilisée pour l’authentification SMTP          |
| `SMTP_PASS`   | Mot de passe SMTP ou mot de passe applicatif                 |
| `DB_HOST`     | Adresse du serveur de base de données                        |
| `DB_USER`     | Utilisateur de la base de données                            |
| `DB_PASSWORD` | Mot de passe de la base de données                           |
| `DB_NAME`     | Nom de la base de données                                    |
| `JWT_SECRET`  | Clé secrète utilisée pour générer et vérifier les tokens JWT |

## Exemple `.env.example`

Créer aussi un fichier `.env.example` à versionner sur Git :

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=example@mail.example
SMTP_PASS=your_smtp_password

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=""
DB_NAME=orbeepro

JWT_SECRET=your_jwt_secret_key
```

## Sécurité

Le fichier `.env` contient des informations sensibles. Il ne doit jamais être envoyé sur Git.

Ajouter cette ligne dans `.gitignore` :

```gitignore
.env
node_modules/
```

Seul le fichier `.env.example` doit être versionné afin de documenter les variables nécessaires au projet.

## Lancement du projet

En mode développement :

```bash
npm run dev
```

Ou en mode production :

```bash
npm start
```

## Vérification SMTP

Si une erreur de type suivante apparaît :

```bash
Missing credentials for "PLAIN"
```

cela signifie généralement que `SMTP_USER` ou `SMTP_PASS` est manquant, vide ou mal chargé depuis le fichier `.env`.

Vérifier les variables avec :

```bash
node -e "require('dotenv').config(); console.log({
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: !!process.env.SMTP_USER,
  SMTP_PASS: !!process.env.SMTP_PASS
})"
```

Le résultat attendu doit afficher :

```bash
SMTP_USER: true
SMTP_PASS: true
```

## Redémarrage avec PM2

Si l’application tourne avec PM2, redémarrer le service après modification du fichier `.env` :

```bash
pm2 restart all --update-env
```

Puis consulter les logs :

```bash
pm2 logs
```
