
import sqlite3 from 'sqlite3';
import { join } from 'path';

// Abstraction de la base de données
// Permet de changer facilement de stratégie (SQLite -> MySQL/Postgres) plus tard.
class Database {
    constructor() {
        this.db = null;
        this.type = 'sqlite'; // 'sqlite', 'mysql', 'postgres'
    }

    connect(config = {}) {
        return new Promise((resolve, reject) => {
            if (this.type === 'sqlite') {
                const dbPath = config.path || './database.sqlite';
                this.db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        console.error('❌ DB Connection Error:', err);
                        reject(err);
                    } else {
                        console.log(`✅ Connected to SQLite database at ${dbPath}`);
                        this.initSchema().then(resolve).catch(reject);
                    }
                });
            } else {
                reject(new Error("Driver not implemented yet"));
            }
        });
    }

    // Promisify SQLite methods
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    async initSchema() {
        // Schema agnostique (ANSI SQL compatible autant que possible)
        const schemas = [
            `CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                name TEXT,
                role TEXT,
                school TEXT,
                city TEXT,
                email TEXT,
                data TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS quizzes (
                id TEXT PRIMARY KEY,
                professorId TEXT,
                title TEXT,
                status TEXT,
                data TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY,
                professorId TEXT,
                title TEXT,
                type TEXT,
                status TEXT,
                data TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                professorId TEXT,
                date TEXT,
                type TEXT,
                data TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS results (
                id TEXT PRIMARY KEY,
                quizId TEXT,
                studentId TEXT,
                score REAL,
                submittedAt TEXT,
                data TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                to_email TEXT,
                subject TEXT,
                body TEXT,
                status TEXT,
                sent_at TEXT
            )`
        ];

        for (const sql of schemas) {
            await this.run(sql);
        }

        // --- MIGRATIONS AUTOMATIQUES ---
        // Vérifie et corrige la structure si la base de données existait déjà
        if (this.type === 'sqlite') {
            try {
                // Vérifier si la colonne 'email' existe dans 'users'
                const cols = await this.query("PRAGMA table_info(users)");
                const hasEmail = cols.some(c => c.name === 'email');
                
                if (!hasEmail) {
                    console.log("🔄 Migration DB : Ajout de la colonne 'email' à la table 'users'...");
                    await this.run("ALTER TABLE users ADD COLUMN email TEXT");
                }
            } catch (e) {
                console.warn("⚠️ Echec de la migration automatique:", e.message);
            }
        }
    }
}

export const db = new Database();
