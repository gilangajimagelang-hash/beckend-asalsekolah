require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const PoolObj = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD || ''), 
    port: Number(process.env.DB_PORT) || 5432,
});

PoolObj.connect((err, client, release) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database PostgreSQL:', err.message);
    } else {
        console.log('✅ Berhasil terhubung ke database PostgreSQL!');
        release();
    }
});

app.get('/', (req, res) => {
    res.json({ status: "success", message: "API Portal Ruang TI C Aktif!" });
});

app.get('/api/asal-sekolah', async (req, res) => {
    try {
        const result = await PoolObj.query('SELECT * FROM asal_sekolah ORDER BY id_sekolah ASC');
        res.json({ status: "success", data: result.rows });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.post('/api/asal-sekolah', async (req, res) => {
    try {
        const { nama_sekolah, alamat } = req.body;
        const newSekolah = await PoolObj.query(
            'INSERT INTO asal_sekolah (nama_sekolah, alamat) VALUES ($1, $2) RETURNING *',
            [nama_sekolah, alamat]
        );
        res.status(201).json({ 
            status: "success", 
            message: "Data asal sekolah berhasil ditambahkan!", 
            data: newSekolah.rows[0] 
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.put('/api/asal-sekolah/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_sekolah, alamat } = req.body;
        const updateSekolah = await PoolObj.query(
            'UPDATE asal_sekolah SET nama_sekolah = $1, alamat = $2 WHERE id_sekolah = $3 RETURNING *',
            [nama_sekolah, alamat, id]
        );

        if (updateSekolah.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Data sekolah tidak ditemukan" });
        }

        res.json({ 
            status: "success", 
            message: "Data asal sekolah berhasil diperbarui!", 
            data: updateSekolah.rows[0] 
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.delete('/api/asal-sekolah/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteSekolah = await PoolObj.query(
            'DELETE FROM asal_sekolah WHERE id_sekolah = $1 RETURNING *', 
            [id]
        );

        if (deleteSekolah.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Data sekolah tidak ditemukan" });
        }

        res.json({ 
            status: "success", 
            message: "Data asal sekolah berhasil dihapus!" 
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.get('/api/mahasiswa', async (req, res) => {
    try {
        const query = `
            SELECT mahasiswa.id_mahasiswa, mahasiswa.nama, asal_sekolah.id_sekolah, asal_sekolah.nama_sekolah 
            FROM mahasiswa 
            JOIN asal_sekolah ON mahasiswa.id_sekolah = asal_sekolah.id_sekolah
            ORDER BY mahasiswa.id_mahasiswa ASC;
        `;
        const result = await PoolObj.query(query);
        res.json({ status: "success", data: result.rows });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server Ruang TI C berjalan di http://localhost:${port}`);
});