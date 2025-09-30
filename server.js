import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// Funzione per creare la tabella users, se non esiste
async function creaTabellaUtenti() {
  const query = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `;
  try {
    await pool.query(query);
    console.log("Tabella 'users' creata o verificata esistenza correttamente");
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

app.get('/api/utenti', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero degli utenti:', err);
    next(err);
  }
});

app.post('/api/utenti', async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Nome mancante' });
    return;
  }
  try {
    const result = await pool.query('INSERT INTO users(name) VALUES($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Errore POST /api/utenti:', err);
    next(err);
  }
});

app.delete('/api/utenti/:id', async (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID utente non valido' });
    return;
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Utente non trovato' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('Errore nell\'eliminazione dell\'utente:', err);
    next(err);
  }
});

// Middleware gestione errori
app.use((err, req, res, next) => {
  console.error('Middleware errore:', err);
  res.status(500).json({ error: err.message || 'Errore interno del server' });
});
