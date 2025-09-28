// Versione 1.0
// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
// Definisci la porta su cui girerà il tuo server locale
const port = 3000; 

// Abilita CORS per permettere a frontend esterni di chiamare questa API
app.use(cors());

// --- Configurazione Database SQLite (Temporaneo in RAM) ---
// Usa ":memory:" per un DB temporaneo veloce e che non richiede file
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        return console.error("Errore connessione DB:", err.message);
    }
    console.log('1. Connesso al database SQLite in memoria.');
});

// Eseguiamo le operazioni iniziali: crea la tabella e inserisce un dato di prova
db.serialize(() => {
    // Crea la tabella 'utenti' se non esiste
    db.run("CREATE TABLE IF NOT EXISTS utenti (id INTEGER PRIMARY KEY, nome TEXT)");
    
    // Inserisce l'utente di prova 'Mario'
    db.run("INSERT INTO utenti (nome) VALUES ('Mario')");
    console.log('2. Tabella utenti creata e dato di prova inserito.');
});

// --- Endpoint API ---

// Endpoint di test sulla root. Prova a chiamare http://localhost:3000/
app.get('/', (req, res) => {
    res.send('API Node.js Funzionante! Vai a /api/utenti per i dati.');
});

// Endpoint per recuperare tutti gli utenti
// Prova a chiamare http://localhost:3000/api/utenti
app.get("/api/utenti", (req, res) => {
    const sql = "SELECT * FROM utenti";
    db.all(sql, [], (err, rows) => {
        if (err) {
            // Se c'è un errore del DB, restituisce un codice 500
            res.status(500).json({ "error": err.message });
            return;
        }
        // Restituisce i dati in formato JSON
        res.json(rows);
    });
});

// --- Avvio Server ---
app.listen(port, () => {
    console.log(`3. Server Node.js in esecuzione su http://localhost:${port}`);
    console.log(`Test API: http://localhost:${port}/api/utenti`);
});

// Importante: questa parte gestisce la chiusura del DB se premi Ctrl+C
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('4. Connessione al database SQLite chiusa. Uscita.');
        process.exit(0);
    });
});