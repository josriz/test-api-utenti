const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3000;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});


// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE']
}));
app.use(express.json());


// Creazione tabella users al primo avvio
async function creaTabellaUtenti() {
  const query = `
    CREATE TABLE IF NOT EXISTS public.users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  try {
    await pool.query(query);
    console.log("Tabella 'users' creata o già esistente");
  } catch (err) {
    console.error('Errore durante la creazione della tabella users:', err);
  }
}


// Connessione e avvio server
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Errore durante la connessione al database', err.stack);
    process.exit(1);
  } else {
    console.log('Connesso al database PostgreSQL!');
    await creaTabellaUtenti();
    release();


    app.listen(port, () => {
      console.log(`Server API in ascolto sulla porta ${port}`);
    });
  }
});


// Rotte API
app.get('/', (req, res) => {
  res.send('API Node.js Funzionante! Vai a /api/utenti per i dati.');
});


app.get('/api/utenti', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, created_at FROM public.users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero degli utenti:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});


app.post('/api/utenti', async (req, res) => {
  const { name } = req.body;
  console.log('POST /api/utenti chiamato con body:', req.body);
  if (!name) {
    console.log('POST /api/utenti campo "name" mancante');
    return res.status(400).json({ error: 'Il campo "name" è richiesto' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO public.users (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );
    console.log('Utente inserito:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Errore nell\'aggiunta dell\'utente:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});


app.delete('/api/utenti/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  console.log('DELETE /api/utenti/:id chiamato con id:', id);
  if (isNaN(id)) {
    console.log('DELETE id non valido:', req.params.id);
    return res.status(400).json({ error: 'ID utente non valido' });
  }
  try {
    const result = await pool.query('DELETE FROM public.users WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      console.log('DELETE utente non trovato per id:', id);
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    console.log('Utente eliminato:', result.rows[0]);
    res.status(204).send();
  } catch (err) {
    console.error('Errore nell\'eliminazione dell\'utente:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});
