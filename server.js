const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configurazione PostgreSQL per Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors({
    origin: '*', // Permette l'accesso da qualsiasi origine (incluso il tuo frontend su Render)
    methods: ['GET', 'POST', 'DELETE'] // I metodi HTTP consentiti
}));
app.use(express.json()); // Per parsare il corpo JSON delle richieste

// Testa la connessione al database all'avvio
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Errore durante la connessione al database', err.stack);
    }
    console.log('Connesso al database PostgreSQL!');
    release();
});

// Endpoint Radice
app.get('/', (req, res) => {
  res.send('API Node.js Funzionante! Vai a /api/utenti per i dati.');
});


/*
 * ROTTE API /api/utenti
 * Nota: il percorso è /api/utenti per risolvere il problema di routing su Render
 */

// 1. GET: Recupera tutti gli utenti
app.get('/api/utenti', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Errore nel recupero degli utenti:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// 2. POST: Aggiunge un nuovo utente
app.post('/api/utenti', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Il campo "name" è richiesto' });
    }
    try {
        // Inserisce l'utente e ritorna l'utente appena creato (inclusi id e created_at)
        const result = await pool.query(
            'INSERT INTO users (name) VALUES ($1) RETURNING id, name, created_at',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Errore nell\'aggiunta dell\'utente:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// 3. DELETE: Rimuove un utente per ID (NUOVO ENDPOINT)
app.delete('/api/utenti/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID utente non valido' });
    }

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Ritorna una risposta di successo senza contenuto
        res.status(204).send();

    } catch (err) {
        console.error('Errore nell\'eliminazione dell\'utente:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});


// Avvia il server
app.listen(port, () => {
  console.log(`Server API in ascolto sulla porta ${port}`);
});
