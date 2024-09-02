const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const bodyParser = require('body-parser');
const createDatabaseAndTables = require('./db');

dotenv.config();

const app = express();
const port = 3000;

// Configurar multer para manejar la carga de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());

// Configuración de la base de datos
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Ruta para subir la imagen
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }
    // Devuelve la URL de la imagen
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Ruta para obtener todos los productos
app.get('/productos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM productos');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Ruta para obtener un producto por ID
app.get('/productos/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [productId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener producto:', err);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// Ruta para crear un nuevo producto
app.post('/productos', async (req, res) => {
    const { nombre, precio, descripcion, imagen } = req.body;
    const sql = 'INSERT INTO productos (nombre, precio, descripcion, imagen) VALUES (?, ?, ?, ?)';
    try {
        const [result] = await db.query(sql, [nombre, precio, descripcion, imagen]);
        res.status(201).json({ id: result.insertId, nombre, precio, descripcion, imagen });
    } catch (err) {
        console.error('Error al crear producto:', err);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// Ruta para actualizar un producto
app.put('/productos/:id', async (req, res) => {
    const productId = req.params.id;
    const { nombre, precio, descripcion, imagen } = req.body;
    const sql = 'UPDATE productos SET nombre = ?, precio = ?, descripcion = ?, imagen = ? WHERE id = ?';
    try {
        const [result] = await db.query(sql, [nombre, precio, descripcion, imagen, productId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ id: productId, nombre, precio, descripcion, imagen });
    } catch (err) {
        console.error('Error al actualizar producto:', err);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// Ruta para eliminar un producto
app.delete('/productos/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const [result] = await db.query('DELETE FROM productos WHERE id = ?', [productId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// Ruta para registrar administradores
app.post('/api/register-admin', (req, res) => {
    const { email, password } = req.body;
    const query = 'INSERT INTO usuarios (email, password, role) VALUES (?, ?, ?)';
    db.query(query, [email, password, 'admin'], (err, results) => {
        if (err) return res.status(500).send('Error al registrar administrador');
        res.status(200).send('Administrador registrado exitosamente');
    });
});

// Ruta para registrar clientes
app.post('/api/register-client', (req, res) => {
    const { nombre, email, password } = req.body;
    const query = 'INSERT INTO clientes (nombre, email, password) VALUES (?, ?, ?)';
    db.query(query, [nombre, email, password], (err, results) => {
        if (err) return res.status(500).send('Error al registrar cliente');
        res.status(200).send('Cliente registrado exitosamente');
    });
});

// Función para descargar y almacenar un número limitado de productos de la API
const fetchAndStoreProducts = async (limit = 23) => {
    try {
        const response = await axios.get('https://api.escuelajs.co/api/v1/products');
        const products = response.data.slice(0, limit);

        console.log('Productos obtenidos de la API:', JSON.stringify(products, null, 2));

        const connection = await db.getConnection();

        const selectQuery = 'SELECT * FROM productos WHERE nombre = ?';
        const insertQuery = `
            INSERT INTO productos (nombre, precio, descripcion, imagen)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                precio = VALUES(precio),
                descripcion = VALUES(descripcion),
                imagen = VALUES(imagen)
        `;

        for (const product of products) {
            const [existingProduct] = await connection.query(selectQuery, [product.title]);
            if (existingProduct.length === 0) {
                await connection.execute(insertQuery, [
                    product.title,
                    product.price,
                    product.description,
                    product.images[0],
                ]);
            }
        }

        console.log('Productos almacenados en la base de datos');
        connection.release();
    } catch (error) {
        console.error('Error al obtener o almacenar productos:', error);
    }
};

// Servir archivo estático index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(port, async () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    await createDatabaseAndTables();
    await fetchAndStoreProducts(23);  // Limitar a 23 productos
});
