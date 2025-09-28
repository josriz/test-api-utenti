// server.js - Backend Node.js con supporto PostgreSQL e CRUD
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Permette di leggere JSON nel body delle richieste

// Configurazione del client PostgreSQL
let dbClient;

try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL non configurata. Assicurati che il servizio Render sia collegato al database.");
    }

    dbClient = new Client({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false, // Necessario per Render
        },
    });

    dbClient.connect()
        .then(() => console.log('Connesso con successo a PostgreSQL su Render'))
        .catch(err => console.error('Errore di connessione a PostgreSQL', err.stack));

} catch (error) {
    console.error("Errore fatale nella configurazione del database:", error.message);
    // In un ambiente di produzione, qui si chiuderebbe l'applicazione.
}

// Funzione per inizializzare la tabella (crea la tabella se non esiste)
async function initializeDb() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await dbClient.query(createTableQuery);
        console.log('Tabella "users" verificata o creata con successo.');
    } catch (err) {
        console.error('Errore durante l\'inizializzazione del database:', err);
    }
}

// Esegui l'inizializzazione del database all'avvio
if (dbClient) {
    initializeDb();
}

// Endpoint GET: Ottiene tutti gli utenti
app.get('/utenti', async (req, res) => {
    try {
        const result = await dbClient.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Errore durante il recupero degli utenti:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Endpoint POST: Aggiunge un nuovo utente
app.post('/utenti', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Il nome è obbligatorio' });
    }
    try {
        const query = 'INSERT INTO users(name) VALUES($1) RETURNING *';
        const result = await dbClient.query(query, [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Errore durante l\'aggiunta dell\'utente:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// NUOVO ENDPOINT DELETE: Rimuove un utente tramite ID
app.delete('/utenti/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID non valido' });
    }
    try {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
        const result = await dbClient.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        res.json({ message: 'Utente eliminato con successo', deletedUser: result.rows[0] });
    } catch (err) {
        console.error(`Errore durante l'eliminazione dell'utente con ID ${id}:`, err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Endpoint di base per il controllo dello stato
app.get('/', (req, res) => {
    res.send('API Utenti Node.js in esecuzione.');
});

// Avvio del server
app.listen(port, () => {
    console.log(`Server API in ascolto sulla porta ${port}`);
});
