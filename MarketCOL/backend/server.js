/**
 * ============================================
 * SERVIDOR PRINCIPAL - E-COMMERCE BACKEND
 * ============================================
 *
 * Punto de entrada principal del backend.
 *
 * Responsabilidades:
 * 1. Cargar variables de entorno
 * 2. Crear y configurar Express
 * 3. Registrar middlewares globales
 * 4. Montar las rutas de la API
 * 5. Configurar manejo de errores
 * 6. Conectar con MySQL
 * 7. Sincronizar las tablas
 * 8. Ejecutar los seeders
 * 9. Iniciar el servidor
 */

// ==========================================
// IMPORTACIONES
// ==========================================

const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const {
  testConnection,
  syncDatabase
} = require('./config/database');

const {
  initAssociations
} = require('./models');

const {
  runSeeders
} = require('./seeders/adminSeeder');

// ==========================================
// CREAR APLICACIÓN EXPRESS
// ==========================================

const app = express();

// Deshabilitar X-Powered-By.
// Evita revelar al cliente que el servidor utiliza Express.
app.disable('x-powered-by');

// ==========================================
// CONFIGURACIÓN DEL PUERTO
// ==========================================

const PORT =
  process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================

// CORS
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      'http://localhost:3000',

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

// ==========================================
// PARSER JSON
// ==========================================

app.use(
  express.json()
);

// ==========================================
// PARSER URL-ENCODED
// ==========================================

app.use(
  express.urlencoded({
    extended: true
  })
);

// ==========================================
// ARCHIVOS ESTÁTICOS - UPLOADS
// ==========================================

app.use(
  '/uploads',
  express.static(
    path.join(
      __dirname,
      'uploads'
    )
  )
);

// ==========================================
// ARCHIVOS ESTÁTICOS - IMÁGENES
// ==========================================

app.use(
  '/images',
  express.static(
    path.join(
      __dirname,
      '../frontend/public/images'
    )
  )
);

// ==========================================
// LOGGING DE DESARROLLO
// ==========================================
//
// Se eliminó el logging de:
// req.method
// req.path
//
// Estos valores provienen directamente de las
// peticiones del usuario y SonarQube los detecta
// como datos controlados por el usuario.
//
// No se registran datos de la petición directamente
// para evitar vulnerabilidades relacionadas con logs.

// ==========================================
// RUTAS BASE
// ==========================================

// GET /
//
// Endpoint para verificar que el servidor
// está funcionando.

app.get(
  '/',
  (req, res) => {
    res.json({
      success: true,
      message:
        '✅ Servidor E-commerce Backend corriendo correctamente',
      version: '1.0.0',
      timestamp:
        new Date().toISOString()
    });
  }
);

// ==========================================
// HEALTH CHECK
// ==========================================

// GET /api/health
//
// Endpoint utilizado para comprobar
// el estado del servidor.

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp:
        new Date().toISOString()
    });
  }
);

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

const authRoutes =
  require('./routes/auth.routes');

app.use(
  '/api/auth',
  authRoutes
);

// ==========================================
// RUTAS DEL ADMINISTRADOR
// ==========================================

const adminRoutes =
  require('./routes/admin.routes');

app.use(
  '/api/admin',
  adminRoutes
);

// ==========================================
// RUTAS DEL CLIENTE
// ==========================================

const clienteRoutes =
  require('./routes/cliente.routes');

app.use(
  '/api',
  clienteRoutes
);

// ==========================================
// RUTA 404
// ==========================================
//
// Se ejecuta cuando ninguna ruta anterior
// coincide con la petición.
//
// No devolvemos req.path para evitar reflejar
// datos controlados por el usuario en la respuesta.

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        '❌ Ruta no encontrada'
    });
  }
);

// ==========================================
// MANEJO GLOBAL DE ERRORES
// ==========================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    // Registrar únicamente información
    // controlada por el servidor.
    console.error(
      '❌ Error interno del servidor'
    );

    // ========================================
    // ERROR DE MULTER
    // ========================================

    if (
      err.name === 'MulterError'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Error al subir archivo'
      });
    }

    // ========================================
    // ERROR GENERAL
    // ========================================

    const statusCode =
      Number.isInteger(err.status) &&
      err.status >= 400 &&
      err.status < 600
        ? err.status
        : 500;

    // Mensaje genérico para producción.
    const message =
      process.env.NODE_ENV ===
      'development'
        ? (
            typeof err.message ===
            'string' &&
            err.message.length <= 200
              ? err.message
              : 'Error interno del servidor'
          )
        : 'Error interno del servidor';

    const response = {
      success: false,
      message
    };

    // El stack solamente se incluye
    // durante desarrollo.
    if (
      process.env.NODE_ENV ===
      'development' &&
      typeof err.stack === 'string'
    ) {
      response.stack =
        err.stack;
    }

    res.status(
      statusCode
    ).json(response);
  }
);

// ==========================================
// INICIALIZAR SERVIDOR Y BASE DE DATOS
// ==========================================

const startServer =
  async () => {

    try {

      // ========================================
      // INICIO
      // ========================================

      console.log(
        '🚀 Iniciando servidor E-commerce Backend...\n'
      );

      // ========================================
      // CONEXIÓN A MYSQL
      // ========================================

      console.log(
        '📡 Conectando a MySQL...'
      );

      const dbConnected =
        await testConnection();

      if (!dbConnected) {

        console.error(
          '❌ No se pudo conectar a MySQL. Verifica XAMPP y el archivo .env'
        );

        process.exit(1);
      }

      // ========================================
      // SINCRONIZACIÓN DE BASE DE DATOS
      // ========================================

      console.log(
        '\n📊 Sincronizando modelos con la base de datos...'
      );

      // Inicializar asociaciones
      initAssociations();

      // ========================================
      // CONFIGURACIÓN DE TABLAS
      // ========================================
      //
      // false = no elimina las tablas.
      //
      // true = permite alterar las tablas existentes
      // para sincronizarlas con los modelos.
      //
      // Se mantiene como estaba en tu proyecto.

      const alterTables =
        true;

      const dbSynced =
        await syncDatabase(
          false,
          alterTables
        );

      if (!dbSynced) {

        console.error(
          '❌ Error al sincronizar la base de datos'
        );

        process.exit(1);
      }

      // ========================================
      // SEEDERS
      // ========================================

      await runSeeders();

      // ========================================
      // INICIAR SERVIDOR
      // ========================================

      app.listen(
        PORT,
        () => {

          console.log(
            '\n╔════════════════════════════════════════════════╗'
          );

          console.log(
            `║  ✅ Servidor corriendo en puerto ${PORT}          ║`
          );

          console.log(
            `║  🌐 URL: http://localhost:${PORT}                ║`
          );

          console.log(
            `║  📚 Documentación API: http://localhost:${PORT}  ║`
          );

          console.log(
            `║  🗄️  Base de datos: ${process.env.DB_NAME}        ║`
          );

          console.log(
            `║  🔧 Modo: ${process.env.NODE_ENV}                     ║`
          );

          console.log(
            '╚════════════════════════════════════════════════╝\n'
          );

          console.log(
            '📝 Servidor listo para recibir peticiones...\n'
          );
        }
      );

    } catch (error) {

      // No mostramos el error completo al cliente.
      // Se registra únicamente en el servidor.

      console.error(
        '❌ Error fatal al iniciar el servidor'
      );

      process.exit(1);
    }
  };

// ==========================================
// CIERRE GRACEFUL
// ==========================================

process.on(
  'SIGINT',
  () => {

    console.log(
      '\n\n⚠️ Cerrando servidor...'
    );

    process.exit(0);
  }
);

// ==========================================
// PROMESAS NO MANEJADAS
// ==========================================

process.on(
  'unhandledRejection',
  (err) => {

    console.error(
      '❌ Error no manejado en el servidor'
    );

    process.exit(1);
  }
);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

startServer();

// ==========================================
// EXPORTAR APP
// ==========================================
//
// Permite utilizar Express en pruebas
// con Jest + Supertest.

module.exports = app;