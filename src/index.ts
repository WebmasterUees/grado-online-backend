import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import leadsRouter from './routes/leads.js';
import pool from './config/database.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(helmet());

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

app.use('/api', apiRateLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Servidor funcionando' });
});

// Test de conexión a base de datos
app.get('/db-test', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({
      success: false,
      message: 'Ruta no encontrada',
    });
    return;
  }

  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({
      success: true,
      message: 'Conexión a BD exitosa',
      timestamp: result.rows[0].now,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Error conectando a BD',
    });
  }
});

// Rutas
app.use('/api/leads', leadsRouter);

// Ruta 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║    🎓 MAESTRÍAS ONLINE - Backend    ║
  ║    Servidor escuchando en puerto    ║
  ║    ${PORT.toString().padEnd(27)}║
  ╚══════════════════════════════════════╝
  `);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🗄️  DB test: http://localhost:${PORT}/db-test`);
  }
});
