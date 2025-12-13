
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet'; // Security Headers
import { GoogleGenAI, Type } from "@google/genai"; // Import SDK Backend

// Nouveaux imports
import { db } from './backend/db.js';
import { emailService } from './backend/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
// Sécurité JWT : Utiliser une variable d'env ou une clé forte par défaut
const JWT_SECRET = process.env.JWT_SECRET || 'tinmel_secure_key_' + Date.now(); 
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY; // Récupération clé serveur
const LOCK_FILE = join(__dirname, 'installed.lock');

// --- SÉCURITÉ ---

// 1. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // Limite globale plus large pour l'API
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Trop de requêtes, veuillez réessayer plus tard." }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    limit: 20, // 20 tentatives de login max par heure par IP
    message: { error: "Trop de tentatives de connexion. Réessayez dans une heure." }
});

// 2. Helmet (Security Headers)
// Désactivation de CSP pour éviter les conflits avec les scripts externes (ESM.sh, Google Fonts) en mode dev/demo
app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false
}));

// --- INITIALISATION DB ---
db.connect({ path: process.env.DB_PATH || './database.sqlite' });

// --- CONFIGURATION MULTER ---
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir) },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + safeName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (Video support)
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg',
            'video/mp4', 'video/webm', 'video/ogg' // Video types added
        ];
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(null, true); 
        }
    }
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
    credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir));
app.use('/api/', limiter); // Appliquer rate limit global aux API

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Token invalide" });
        req.user = decoded;
        next();
    });
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Accès refusé" });
        }
        next();
    };
};

// --- SYSTEM & INSTALLATION ROUTES ---

app.get('/api/setup/status', async (req, res) => {
    try {
        const isLocked = fs.existsSync(LOCK_FILE);
        const admin = await db.get("SELECT count(*) as count FROM users WHERE role = 'ADMIN'");
        const installed = isLocked && admin && admin.count > 0;
        res.json({ installed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/setup/checks', (req, res) => {
    const checks = {
        nodeVersion: process.version,
        platform: os.platform(),
        memory: Math.round(os.totalmem() / 1024 / 1024) + " MB",
        writeAccess: false,
        dbConnection: false
    };
    try {
        const testFile = join(__dirname, 'write_test.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        checks.writeAccess = true;
    } catch (e) {
        checks.writeAccess = false;
    }
    if (db.db) {
        checks.dbConnection = true;
    }
    res.json(checks);
});

app.post('/api/setup/install', async (req, res) => {
    const { username, password, name, schoolName, adminEmail, dbType, envMode } = req.body;
    if (!username || !password || !schoolName) return res.status(400).json({ error: "Champs requis" });

    try {
        await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ['site_name', schoolName]);
        await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ['install_date', new Date().toISOString()]);
        await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ['db_type', dbType || 'sqlite']);
        await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ['env_mode', envMode || 'production']);

        const id = `admin-${Date.now()}`;
        const hash = bcrypt.hashSync(password, 10);
        
        const existingUser = await db.get("SELECT id FROM users WHERE username = ?", [username.trim().toLowerCase()]);
        
        if (existingUser) {
            await db.run(
                `UPDATE users SET password = ?, name = ?, role = 'ADMIN', email = ?, data = ? WHERE id = ?`, 
                [hash, name || 'Administrateur', adminEmail || '', JSON.stringify({ schoolName }), existingUser.id]
            );
        } else {
            await db.run(
                `INSERT INTO users (id, username, password, name, role, email, data) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [id, username.trim().toLowerCase(), hash, name || 'Administrateur', 'ADMIN', adminEmail || '', JSON.stringify({ schoolName })]
            );
        }

        fs.writeFileSync(LOCK_FILE, `INSTALLED_ON=${new Date().toISOString()}\nDB=${dbType}\nMODE=${envMode}`);

        if (adminEmail) {
            await emailService.send(
                adminEmail, 
                "Bienvenue sur Tinmel LMS", 
                `Votre instance Tinmel a été installée avec succès.\nURL: ${req.get('host')}\nAdmin: ${username}\nMode: ${envMode}`
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Install Error:", err);
        if (err.message && err.message.includes('UNIQUE constraint')) {
             return res.status(400).json({ error: "Conflit de données : Cet utilisateur existe déjà." });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- AI ROUTES (SECURE BACKEND PROXY) ---

// Generate Quiz
app.post('/api/ai/generate-quiz', authenticateToken, requireRole(['PROFESSOR', 'ADMIN']), async (req, res) => {
    const { topic, count, language } = req.body;
    
    if (!API_KEY) return res.status(500).json({ error: "Clé API Gemini non configurée sur le serveur. Ajoutez API_KEY dans le fichier .env" });

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const langName = language === 'ar' ? 'Arabe' : 'Français';
        const booleanInstructions = language === 'ar' ? 'Pour BOOLEAN, la réponse doit être "Vrai" ou "Faux" (je traduirai coté client).' : 'Pour BOOLEAN, la réponse doit être "Vrai" ou "Faux".';

        const prompt = `
          Génère un quiz de ${count || 5} questions sur le sujet : "${topic}".
          Le quiz doit être OBLIGATOIREMENT en ${langName}.
          
          Types de questions autorisés (Mélange-les) : 
          1. Choix Multiples (MCQ) : Fournis 4 options.
          2. Vrai/Faux (BOOLEAN) : ${booleanInstructions}
          3. Réponse Courte (SHORT_ANSWER).
          4. Appariement (MATCHING) : Fournis 4 paires {left, right}.
          5. Question Ouverte (ESSAY).
          6. Texte à trous (FILL_IN_THE_BLANK) : Mets les réponses entre [crochets].
          
          Format JSON attendu (Schema Strict).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            type: { 
                                type: Type.STRING, 
                                enum: ['MCQ', 'BOOLEAN', 'SHORT_ANSWER', 'MATCHING', 'ESSAY', 'FILL_IN_THE_BLANK'] 
                            },
                            points: { type: Type.NUMBER },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswer: { type: Type.STRING }, // Pour Boolean, convertir en string
                            matchingPairs: { 
                                type: Type.ARRAY, 
                                items: { 
                                    type: Type.OBJECT, 
                                    properties: { left: { type: Type.STRING }, right: { type: Type.STRING } }
                                } 
                            },
                            explanation: { type: Type.STRING }
                        },
                        required: ["text", "type", "points"]
                    }
                }
            }
        });

        res.json({ questions: JSON.parse(response.text) });
    } catch (e) {
        console.error("AI Error:", e);
        res.status(500).json({ error: "Erreur lors de la génération IA: " + e.message });
    }
});

// Grade Essay
app.post('/api/ai/grade-essay', authenticateToken, async (req, res) => {
    const { question, answer, context } = req.body;
    
    if (!API_KEY) return res.status(500).json({ error: "Clé API Gemini non configurée." });

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const prompt = `
            Agis comme un professeur. Évalue cette réponse.
            Question: "${question}"
            Réponse étudiant: "${answer}"
            Contexte attendu: "${context || 'N/A'}"
            Note sur 10. Retourne JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING }
                    }
                }
            }
        });

        res.json(JSON.parse(response.text));
    } catch (e) {
        console.error("AI Grading Error:", e);
        res.status(500).json({ error: "Erreur de correction IA." });
    }
});

// --- AUTH & USER ROUTES ---

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Champs requis" });

    try {
        const user = await db.get("SELECT * FROM users WHERE username = ?", [username.trim().toLowerCase()]);
        if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ error: "Mot de passe incorrect" });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        const extraData = JSON.parse(user.data || '{}');
        const userObj = { ...user, ...extraData };
        delete userObj.password;
        
        if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
            delete userObj.readablePassword; 
        }
        delete userObj.data;

        // Secure Cookie
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', // Secure uniquement en prod (HTTPS)
            sameSite: 'lax', 
            maxAge: 24 * 60 * 60 * 1000 
        });
        res.json(userObj);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
        if (!user) return res.status(404).json({ error: "User not found" });
        
        const extraData = JSON.parse(user.data || '{}');
        const userObj = { ...user, ...extraData };
        delete userObj.password;
        if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') delete userObj.readablePassword;
        delete userObj.data;
        res.json(userObj);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// User Management
app.post('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role === 'STUDENT') return res.status(403).json({error: "Forbidden"});

    const { id, username, password, name, role, school, city, email, ...extraData } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const finalData = { ...extraData, readablePassword: password };

    try {
        await db.run(
            `INSERT INTO users (id, username, password, name, role, school, city, email, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, username.trim().toLowerCase(), hash, name, role, school, city, email || '', JSON.stringify(finalData)]
        );
        
        if (email) {
            await emailService.send(email, "Votre compte Tinmel", `Bienvenue ${name}.\nVoici vos identifiants :\nLogin: ${username}\nPasse: ${password}`);
        }

        res.json({ success: true, id });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint')) return res.status(400).json({ error: "Cet identifiant existe déjà." });
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    const { school, city, role, page, limit, q } = req.query;
    
    let query = "SELECT * FROM users WHERE 1=1";
    let countQuery = "SELECT count(*) as count FROM users WHERE 1=1";
    let params = [];

    if (school) { const c = " AND school = ?"; query += c; countQuery += c; params.push(school); }
    if (city) { const c = " AND city = ?"; query += c; countQuery += c; params.push(city); }
    if (role) { const c = " AND role = ?"; query += c; countQuery += c; params.push(role); }
    
    if (q) {
        const c = " AND (name LIKE ? OR username LIKE ? OR school LIKE ?)";
        query += c; countQuery += c;
        const searchParam = `%${q}%`;
        params.push(searchParam, searchParam, searchParam);
    }

    try {
        const countRow = await db.get(countQuery, params);
        
        if (page && limit) {
            query += " LIMIT ? OFFSET ?";
            params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
        }

        const rows = await db.query(query, params);
        const users = rows.map(r => {
            const extra = JSON.parse(r.data || '{}');
            const u = { ...r, ...extra };
            delete u.password; delete u.data;
            if (req.user.role !== 'ADMIN' && req.user.role !== 'COORDINATOR') delete u.readablePassword;
            return u;
        });

        res.json({
            data: users,
            meta: { total: countRow.count, page: parseInt(page) || 1, limit: parseInt(limit) || users.length }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['ADMIN', 'COORDINATOR']), async (req, res) => {
    try {
        await db.run("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const { password, ...updates } = req.body;
    const id = req.params.id;
    
    if (req.user.id !== id && req.user.role !== 'ADMIN' && req.user.role !== 'COORDINATOR') {
        return res.status(403).json({error: "Forbidden"});
    }

    try {
        const row = await db.get("SELECT * FROM users WHERE id = ?", [id]);
        if (!row) return res.status(404).json({ error: "User not found" });

        let extraData = JSON.parse(row.data || '{}');
        extraData = { ...extraData, ...updates };

        let query = "UPDATE users SET ";
        let params = [];

        if (updates.name) { query += "name = ?, "; params.push(updates.name); }
        if (updates.school) { query += "school = ?, "; params.push(updates.school); }
        if (updates.city) { query += "city = ?, "; params.push(updates.city); }
        if (updates.email) { query += "email = ?, "; params.push(updates.email); }

        if (password) {
            query += "password = ?, ";
            params.push(bcrypt.hashSync(password, 10));
            extraData.readablePassword = password;
        }
        
        query += "data = ? WHERE id = ?";
        params.push(JSON.stringify(extraData), id);
        
        await db.run(query, params);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Quiz Submission
app.post('/api/quiz/submit', authenticateToken, async (req, res) => {
    const { quizId, studentId, studentName, answers, timeSpent, essayScores, score, maxScore } = req.body;
    try {
        // Accept the score calculated by the frontend (which includes AI grading)
        // In a production environment, you might want to recalculate everything here for security.
        const finalScore = score || 0;
        const finalMaxScore = maxScore || 0;
        
        const result = {
            id: `res-${Date.now()}`,
            quizId, studentId, studentName, answers, timeSpent,
            score: finalScore, 
            maxScore: finalMaxScore,
            submittedAt: new Date().toISOString(),
            essayScores // Save AI details if needed
        };

        await db.run(
            `INSERT INTO results (id, quizId, studentId, score, submittedAt, data) VALUES (?, ?, ?, ?, ?, ?)`,
            [result.id, quizId, studentId, finalScore, result.submittedAt, JSON.stringify(result)]
        );

        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// File Upload
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// --- STATIC FILES (PRODUCTION) ---
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) res.sendFile(join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Serveur Tinmel démarré sur le port ${PORT}`);
    console.log(`📂 Uploads: ${uploadDir}`);
    console.log(`🔒 Lockfile: ${LOCK_FILE}`);
    console.log(`🤖 AI Service: ${API_KEY ? 'Configuré' : 'Désactivé (Manque API_KEY dans .env)'}`);
});
