// Versione 1.2 - Aggiunta endpoint POST per inserimento utente
// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

// CORREZIONE FONDAMENTALE: Usa la porta fornita da Render (process.env.PORT) 
// o usa 3000 se stai eseguendo localmente.
const port = process.env.PORT || 3000; 

// MIDDLEWARE FONDAMENTALE: Permette a Express di leggere i dati JSON inviati dal frontend (req.body)
app.use(express.json()); 

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

// Endpoint di test sulla root. Prova a chiamare http://IL_TUO_URL/
app.get('/', (req, res) => {
    res.send('API Node.js Funzionante! Vai a /api/utenti per i dati.');
});

// Endpoint per recuperare tutti gli utenti (GET)
app.get("/api/utenti", (req, res) => {
    const sql = "SELECT * FROM utenti";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        // Restituisce i dati in formato JSON
        res.json(rows);
    });
});

// NUOVO ENDPOINT: Aggiunge un nuovo utente (POST)
app.post('/api/utenti', (req, res) => {
    // Estrae il nome dal corpo JSON inviato dal frontend
    const { nome } = req.body;

    if (!nome) {
        // Se il campo 'nome' manca, restituisce un errore 400 Bad Request
        return res.status(400).send({ error: "Il campo 'nome' è richiesto per l'inserimento." });
    }

    // Query per inserire il nuovo utente
    db.run(`INSERT INTO utenti (nome) VALUES (?)`, [nome], function(err) {
        if (err) {
            console.error(err.message);
            // Errore del database
            return res.status(500).send({ error: 'Errore durante l\'inserimento nel database.' });
        }
        // Successo: restituisce l'oggetto inserito con status 201 Created
        res.status(201).send({ id: this.lastID, nome }); 
    });
});


// --- Avvio Server ---
app.listen(port, () => {
    console.log(`3. Server Node.js in esecuzione sulla porta: ${port}`);
    console.log(`Test API: /api/utenti`);
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
