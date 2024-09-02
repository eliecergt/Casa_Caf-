const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const createDatabaseAndTables = async () => {
    // Conexión a MySQL
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        // Crear la base de datos si no existe
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        // Seleccionar la base de datos creada
        await connection.query(`USE ${process.env.DB_NAME}`);
        
        // Crear tabla de productos
        const createProductsTable = `
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL UNIQUE,
                precio DECIMAL(10, 2) NOT NULL,
                descripcion TEXT,
                imagen VARCHAR(255)
            )
        `;
        await connection.query(createProductsTable);

        // Crear tabla de clientes
        const createClientsTable = `
            CREATE TABLE IF NOT EXISTS clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createClientsTable);

        // Crear tabla de administradores
        const createAdminsTable = `
            CREATE TABLE IF NOT EXISTS administradores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createAdminsTable);

        console.log('Base de datos y tablas creadas o ya existen');
    } catch (error) {
        console.error('Error al crear la base de datos o las tablas:', error);
    } finally {
        await connection.end();
    }
};

// Exportar la función para que pueda ser utilizada en otros archivos
module.exports = createDatabaseAndTables;
