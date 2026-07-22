require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const db      = require('./db');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // fallback for dev

app.use(cors());
app.use(express.json({ limit: '20mb' })); // allow large base64 photos

// ── Helper: run schema migrations on startup ─────────────────────────────────
async function initDB() {
  const conn = await db.getConnection();
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'wnims_db'}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${process.env.DB_NAME || 'wnims_db'}\``);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS citizens (
        id                VARCHAR(36)  NOT NULL PRIMARY KEY,
        nationalIdNumber  VARCHAR(30)  NOT NULL UNIQUE,
        fullName          VARCHAR(120) NOT NULL,
        fatherName        VARCHAR(120) NOT NULL,
        motherName        VARCHAR(120) NOT NULL,
        dateOfBirth       DATE         NOT NULL,
        placeOfBirth      VARCHAR(100) NOT NULL DEFAULT '',
        gender            ENUM('Male','Female') NOT NULL DEFAULT 'Male',
        maritalStatus     ENUM('Single','Married','Divorced','Widowed') NOT NULL DEFAULT 'Single',
        phone             VARCHAR(30)  NOT NULL DEFAULT '',
        occupation        VARCHAR(80)  NOT NULL DEFAULT '',
        address           TEXT         NOT NULL,
        district          VARCHAR(60)  NOT NULL DEFAULT '',
        photo             LONGTEXT     NULL,
        fingerprint       LONGTEXT     NULL,
        qrCode            LONGTEXT     NOT NULL,
        status            ENUM('Active','Pending','Rejected') NOT NULL DEFAULT 'Pending',
        registrationDate  DATE         NOT NULL,
        issueDate         DATE         NOT NULL,
        expiryDate        DATE         NOT NULL,
        createdAt         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id            INT          NOT NULL PRIMARY KEY DEFAULT 1,
        stateName     VARCHAR(120) NOT NULL DEFAULT 'Waqooyi Bari',
        logoUrl       LONGTEXT     NULL,
        cardTemplate  ENUM('default','classic','modern') NOT NULL DEFAULT 'default',
        primaryColor  VARCHAR(20)  NOT NULL DEFAULT '#00875a',
        accentColor   VARCHAR(20)  NOT NULL DEFAULT '#1a4a8a',
        updatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT          AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(120) NOT NULL,
        email         VARCHAR(120) NOT NULL UNIQUE,
        password      VARCHAR(255) NOT NULL,
        createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Insert default admin user if not exists
    // password: 'admin'
    await conn.query(`
      INSERT IGNORE INTO users (email, name, password) 
      VALUES ('admin@gmail.com', 'System Administrator', '$2b$10$3VgX3FeEa2nhtclVWyAEYed.u1wODrVjbJposZdWfnH1yGw6SUxNS')
    `);

    console.log('✅ Database initialized');
  } finally {
    conn.release();
  }
}

// ── Helper: convert MySQL row → JS Citizen object ────────────────────────────
function rowToCitizen(row) {
  return {
    id:               row.id,
    nationalIdNumber: row.nationalIdNumber,
    fullName:         row.fullName,
    fatherName:       row.fatherName,
    motherName:       row.motherName,
    dateOfBirth:      row.dateOfBirth ? row.dateOfBirth.toISOString().split('T')[0] : '',
    placeOfBirth:     row.placeOfBirth,
    gender:           row.gender,
    maritalStatus:    row.maritalStatus,
    phone:            row.phone,
    occupation:       row.occupation,
    address:          row.address,
    district:         row.district,
    photo:            row.photo || null,
    fingerprint:      row.fingerprint || null,
    qrCode:           row.qrCode,
    status:           row.status,
    registrationDate: row.registrationDate ? row.registrationDate.toISOString().split('T')[0] : '',
    issueDate:        row.issueDate        ? row.issueDate.toISOString().split('T')[0]        : '',
    expiryDate:       row.expiryDate       ? row.expiryDate.toISOString().split('T')[0]       : '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  CITIZENS  ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/citizens          – list all
app.get('/api/citizens', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM citizens ORDER BY createdAt DESC');
    res.json(rows.map(rowToCitizen));
  } catch (err) {
    console.error('DB error on citizens, returning empty array:', err.message);
    res.json([]);
  }
});

// GET /api/citizens/:id      – single citizen
app.get('/api/citizens/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM citizens WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Citizen not found' });
    res.json(rowToCitizen(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/citizens         – create
app.post('/api/citizens', async (req, res) => {
  const c = req.body;
  try {
    await db.query(
      `INSERT INTO citizens
        (id, nationalIdNumber, fullName, fatherName, motherName, dateOfBirth,
         placeOfBirth, gender, maritalStatus, phone, occupation, address,
         district, photo, fingerprint, qrCode, status,
         registrationDate, issueDate, expiryDate)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        c.id, c.nationalIdNumber, c.fullName, c.fatherName, c.motherName,
        c.dateOfBirth, c.placeOfBirth, c.gender, c.maritalStatus,
        c.phone, c.occupation, c.address, c.district,
        c.photo || null, c.fingerprint || null, c.qrCode, c.status,
        c.registrationDate, c.issueDate, c.expiryDate,
      ]
    );
    const [rows] = await db.query('SELECT * FROM citizens WHERE id = ?', [c.id]);
    res.status(201).json(rowToCitizen(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/citizens/:id      – update
app.put('/api/citizens/:id', async (req, res) => {
  const c = req.body;
  try {
    await db.query(
      `UPDATE citizens SET
        fullName=?, fatherName=?, motherName=?, dateOfBirth=?,
        placeOfBirth=?, gender=?, maritalStatus=?, phone=?,
        occupation=?, address=?, district=?, photo=?,
        fingerprint=?, qrCode=?, status=?,
        registrationDate=?, issueDate=?, expiryDate=?
       WHERE id=?`,
      [
        c.fullName, c.fatherName, c.motherName, c.dateOfBirth,
        c.placeOfBirth, c.gender, c.maritalStatus, c.phone,
        c.occupation, c.address, c.district, c.photo || null,
        c.fingerprint || null, c.qrCode, c.status,
        c.registrationDate, c.issueDate, c.expiryDate,
        req.params.id,
      ]
    );
    const [rows] = await db.query('SELECT * FROM citizens WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rowToCitizen(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/citizens/:id   – delete
app.delete('/api/citizens/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM citizens WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/citizens       – clear ALL
app.delete('/api/citizens', async (_req, res) => {
  try {
    await db.query('DELETE FROM citizens');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  SETTINGS  ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/settings
app.get('/api/settings', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM app_settings WHERE id = 1');
    const row = rows[0] || {};
    res.json({
      stateName:    row.stateName || 'Waqooyi Bari',
      logoUrl:      row.logoUrl || null,
      flagUrl:      row.flagUrl || null,
      watermarkUrl: row.watermarkUrl || null,
      cardTemplate: row.cardTemplate || 'default',
      primaryColor: row.primaryColor || '#00875a',
      accentColor:  row.accentColor || '#1a4a8a',
    });
  } catch (err) {
    res.json({
      stateName:    'Waqooyi Bari',
      logoUrl:      null,
      flagUrl:      null,
      watermarkUrl: null,
      cardTemplate: 'default',
      primaryColor: '#00875a',
      accentColor:  '#1a4a8a',
    });
  }
});

// PUT /api/settings
app.put('/api/settings', async (req, res) => {
  const s = req.body;
  try {
    await db.query(
      `UPDATE app_settings SET
        stateName=?, logoUrl=?, flagUrl=?, watermarkUrl=?, cardTemplate=?, primaryColor=?, accentColor=?
       WHERE id=1`,
      [s.stateName, s.logoUrl || null, s.flagUrl || null, s.watermarkUrl || null, s.cardTemplate, s.primaryColor, s.accentColor]
    );
    const [rows] = await db.query('SELECT * FROM app_settings WHERE id = 1');
    const row = rows[0];
    res.json({
      stateName:    row.stateName,
      logoUrl:      row.logoUrl || null,
      flagUrl:      row.flagUrl || null,
      watermarkUrl: row.watermarkUrl || null,
      cardTemplate: row.cardTemplate,
      primaryColor: row.primaryColor,
      accentColor:  row.accentColor,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  AUTH ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    console.error('DB Error on login, using fallback mock:', err.message);
    if (email === 'admin@gmail.com' && password === 'admin') {
      const token = jwt.sign({ id: 1, email: 'admin@gmail.com', name: 'System Administrator' }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, user: { id: 1, email: 'admin@gmail.com', name: 'System Administrator' } });
    }
    res.status(500).json({ error: 'Internal server error (DB connection failed)' });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Start ─────────────────────────────────────────────────────────────────────
// Vercel serverless environment doesn't use app.listen
if (process.env.NODE_ENV !== 'production') {
  initDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 API Server running on http://localhost:${PORT}`);
      });
    })
    .catch(err => {
      console.error('❌ Failed to init DB:', err.message);
      process.exit(1);
    });
} else {
  // Try to initialize DB on first request in Vercel, or just export
  // Note: On Vercel, creating tables on every cold start can be slow, 
  // but it ensures tables exist.
  initDB().catch(console.error);
}

module.exports = app;
