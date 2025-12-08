
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'tinmel_opensource_secret_key'; // À changer en prod

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Base de données SQLite
// Le fichier database.sqlite sera créé automatiquement à la racine
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error('Erreur ouverture base de données', err);
    else console.log('Connecté à la base de données SQLite');
});

// Initialisation des Tables
db.serialize(() => {
    // Table Utilisateurs
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT,
        school TEXT,
        city TEXT,
        data TEXT -- Stockage JSON pour les champs flexibles (XP, Classes, etc.)
    )`);

    // Table Quiz
    db.run(`CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        professorId TEXT,
        title TEXT,
        status TEXT,
        data TEXT -- Contenu complet du quiz en JSON
    )`);

    // Table Résultats
    db.run(`CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        quizId TEXT,
        studentId TEXT,
        score REAL,
        data TEXT
    )`);
});

// --- API ROUTES ---

// INSTALLATION WIZARD CHECK
app.get('/api/setup/status', (req, res) => {
    db.get("SELECT count(*) as count FROM users WHERE role = 'ADMIN'", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        // @ts-ignore
        res.json({ installed: row.count > 0 });
    });
});

// INSTALLATION (CREATE FIRST ADMIN)
app.post('/api/setup/install', (req, res) => {
    const { username, password, name, schoolName } = req.body;
    
    if (!username || !password) return res.status(400).json({ error: "Champs requis" });

    // Check if already installed
    db.get("SELECT count(*) as count FROM users WHERE role = 'ADMIN'", [], (err, row) => {
        // @ts-ignore
        if (row && row.count > 0) {
            return res.status(403).json({ error: "L'application est déjà installée." });
        }

        const id = `admin-${Date.now()}`;
        const hash = bcrypt.hashSync(password, 10);
        const data = JSON.stringify({ schoolName }); // Store school name in meta data

        db.run(`INSERT INTO users (id, username, password, name, role, data) VALUES (?, ?, ?, ?, ?, ?)`, 
            [id, username.trim().toLowerCase(), hash, name || 'Administrateur', 'ADMIN', data],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) return res.status(400).json({ error: "Champs requis" });

    db.get("SELECT * FROM users WHERE username = ?", [username.trim().toLowerCase()], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

        // @ts-ignore
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ error: "Mot de passe incorrect" });

        // @ts-ignore
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        // Fusionner les données JSON avec les colonnes SQL
        // @ts-ignore
        const extraData = JSON.parse(user.data || '{}');
        const userObj = { ...user, ...extraData, token };
        delete userObj.password;
        delete userObj.data;

        res.json(userObj);
    });
});

// Création Utilisateur (Admin/Coordinateur)
app.post('/api/users', (req, res) => {
    const { id, username, password, name, role, school, city, ...extraData } = req.body;
    
    // Hachage du mot de passe pour la sécurité
    const hash = bcrypt.hashSync(password, 10);
    const jsonData = JSON.stringify(extraData);

    db.run(`INSERT INTO users (id, username, password, name, role, school, city, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, username.trim().toLowerCase(), hash, name, role, school, city, jsonData],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: "Cet identifiant existe déjà." });
                }
                return res.status(400).json({ error: err.message });
            }
            res.json({ success: true, id });
        }
    );
});

// Récupérer les utilisateurs (avec filtres simples)
app.get('/api/users', (req, res) => {
    const { school, city, role } = req.query;
    let query = "SELECT * FROM users WHERE 1=1";
    let params = [];
    
    if (school) { query += " AND school = ?"; params.push(school); }
    if (city) { query += " AND city = ?"; params.push(city); }
    if (role) { query += " AND role = ?"; params.push(role); }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const users = rows.map(r => {
            // @ts-ignore
            const extra = JSON.parse(r.data || '{}');
            const u = { ...r, ...extra };
            // @ts-ignore
            delete u.password;
            // @ts-ignore
            delete u.data;
            return u;
        });
        res.json(users);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur Backend Tinmel démarré sur http://localhost:${PORT}`);
    console.log(`🌐 Frontend accessible sur http://localhost:3000`);
});
