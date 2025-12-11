
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tinmel_opensource_secret_key_change_me_in_prod';

// --- CONFIGURATION MULTER (UPLOAD) ---
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite 5MB
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Servir les fichiers uploadés statiquement
app.use('/uploads', express.static(uploadDir));

// Base de données SQLite
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error('Erreur ouverture base de données', err);
    else console.log('Connecté à la base de données SQLite');
});

// Initialisation des Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT,
        school TEXT,
        city TEXT,
        data TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        professorId TEXT,
        title TEXT,
        status TEXT,
        data TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        quizId TEXT,
        studentId TEXT,
        score REAL,
        data TEXT
    )`);
});

// --- API ROUTES ---

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier uploadé.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
});

app.get('/api/setup/status', (req, res) => {
    db.get("SELECT count(*) as count FROM users WHERE role = 'ADMIN'", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        // @ts-ignore
        res.json({ installed: row.count > 0 });
    });
});

app.post('/api/setup/install', (req, res) => {
    const { username, password, name, schoolName } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Champs requis" });

    db.get("SELECT count(*) as count FROM users WHERE role = 'ADMIN'", [], (err, row) => {
        // @ts-ignore
        if (row && row.count > 0) {
            return res.status(403).json({ error: "L'application est déjà installée." });
        }

        const id = `admin-${Date.now()}`;
        const hash = bcrypt.hashSync(password, 10);
        const data = JSON.stringify({ schoolName });

        db.run(`INSERT INTO users (id, username, password, name, role, data) VALUES (?, ?, ?, ?, ?, ?)`, 
            [id, username.trim().toLowerCase(), hash, name || 'Administrateur', 'ADMIN', data],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    });
});

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
        
        // @ts-ignore
        const extraData = JSON.parse(user.data || '{}');
        const userObj = { ...user, ...extraData };
        delete userObj.password;
        delete userObj.data;

        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });
        res.json(userObj);
    });
});

app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        
        // @ts-ignore
        db.get("SELECT * FROM users WHERE id = ?", [decoded.id], (err, user) => {
            if (!user) return res.status(404).json({ error: "User not found" });
            
            // @ts-ignore
            const extraData = JSON.parse(user.data || '{}');
            const userObj = { ...user, ...extraData };
            // @ts-ignore
            delete userObj.password;
            // @ts-ignore
            delete userObj.data;
            res.json(userObj);
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

app.post('/api/users', (req, res) => {
    const { id, username, password, name, role, school, city, ...extraData } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const jsonData = JSON.stringify(extraData);

    db.run(`INSERT INTO users (id, username, password, name, role, school, city, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, username.trim().toLowerCase(), hash, name, role, school, city, jsonData],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) return res.status(400).json({ error: "Cet identifiant existe déjà." });
                return res.status(400).json({ error: err.message });
            }
            res.json({ success: true, id });
        }
    );
});

// GET Users (Paginated & Searchable)
app.get('/api/users', (req, res) => {
    const { school, city, role, page, limit, q } = req.query;
    
    let query = "SELECT * FROM users WHERE 1=1";
    let countQuery = "SELECT count(*) as count FROM users WHERE 1=1";
    let params = [];

    // Filters
    if (school) { const c = " AND school = ?"; query += c; countQuery += c; params.push(school); }
    if (city) { const c = " AND city = ?"; query += c; countQuery += c; params.push(city); }
    if (role) { const c = " AND role = ?"; query += c; countQuery += c; params.push(role); }
    
    // Search (Name or Username)
    if (q) {
        const c = " AND (name LIKE ? OR username LIKE ?)";
        query += c; 
        countQuery += c;
        const searchParam = `%${q}%`;
        params.push(searchParam, searchParam);
    }

    // First: Get Total Count for Pagination UI
    db.get(countQuery, params, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        // @ts-ignore
        const total = row.count;

        // Second: Get Data with LIMIT/OFFSET
        if (page && limit) {
            // @ts-ignore
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += " LIMIT ? OFFSET ?";
            // @ts-ignore
            params.push(parseInt(limit), offset);
        }

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
            
            // Return structured response
            res.json({
                data: users,
                meta: {
                    total,
                    // @ts-ignore
                    page: parseInt(page) || 1,
                    // @ts-ignore
                    limit: parseInt(limit) || users.length
                }
            });
        });
    });
});

app.post('/api/quiz/submit', (req, res) => {
    const { quizId, studentId, studentName, answers, timeSpent, essayScores } = req.body;
    db.get("SELECT data FROM quizzes WHERE id = ?", [quizId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        // @ts-ignore
        if (!row) return res.status(404).json({ error: "Quiz not found" });

        // @ts-ignore
        const quiz = JSON.parse(row.data);
        let score = 0;
        let maxScore = 0;

        quiz.questions.forEach((q) => {
            maxScore += q.points;
            const userAns = answers[q.id];
            
            if (q.type === 'MCQ' || q.type === 'IMAGE_MCQ' || q.type === 'BOOLEAN') {
                if (String(userAns) === String(q.correctAnswer)) score += q.points;
            }
            else if (q.type === 'SHORT_ANSWER') {
                if (typeof userAns === 'string' && typeof q.correctAnswer === 'string' && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
                    score += q.points;
                }
            }
            else if (q.type === 'MATCHING') {
                if (Array.isArray(userAns)) {
                    let allCorrect = true;
                    const correctPairs = q.matchingPairs || [];
                    if (userAns.length !== correctPairs.length) allCorrect = false;
                    else {
                        userAns.forEach((ua) => {
                            const match = correctPairs.find(cp => cp.left === ua.left);
                            if (!match || match.right !== ua.right) allCorrect = false;
                        });
                    }
                    if (allCorrect) score += q.points;
                }
            }
            else if (q.type === 'FILL_IN_THE_BLANK') {
                const matches = q.text.match(/\[(.*?)\]/g) || [];
                const correctValues = matches.map(m => m.replace(/[\[\]]/g, '').trim().toLowerCase());
                const userValues = (Array.isArray(userAns) ? userAns : []).map(v => v.trim().toLowerCase());
                
                let correctCount = 0;
                correctValues.forEach((val, idx) => {
                    if (userValues[idx] === val) correctCount++;
                });
                
                if (correctValues.length > 0) {
                    score += (correctCount / correctValues.length) * q.points;
                }
            }
            else if (q.type === 'ESSAY') {
                if (essayScores && essayScores[q.id]) {
                    score += essayScores[q.id];
                }
            }
        });

        const result = {
            id: `res-${Date.now()}`,
            quizId,
            studentId,
            studentName,
            answers,
            score: Math.round(score * 10) / 10,
            maxScore,
            submittedAt: new Date().toISOString(),
            timeSpent
        };

        db.run(`INSERT INTO results (id, quizId, studentId, score, data) VALUES (?, ?, ?, ?, ?)`,
            [result.id, quizId, studentId, result.score, JSON.stringify(result)],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(result);
            }
        );
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur Backend Tinmel démarré sur http://localhost:${PORT}`);
    console.log(`🌐 Frontend accessible sur http://localhost:3000`);
});
