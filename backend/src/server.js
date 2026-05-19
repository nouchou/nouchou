require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/auth');
const { authRouter, userRouter, cpRouter, activiteRouter } = require('./routes/index');
const { verifierPublic } = require('./controllers/cycloPousseController');

const app = express();
connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { success: false, message: 'Trop de requêtes' } }));

// Route publique QR
app.get('/api/public/verifier/:tokenQR', verifierPublic);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'OK', uptime: Math.round(process.uptime()) }));
app.use('/api/auth',       authRouter);
app.use('/api/users',      userRouter);
app.use('/api/cyclopousse', cpRouter);
app.use('/api/activites',   activiteRouter);

app.use((req, res) => res.status(404).json({ success: false, message: `Route introuvable: ${req.method} ${req.url}` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info(`🚲 Cyclo-Pousse Morondava — port ${PORT}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('unhandledRejection', (err) => { logger.error(err.message); server.close(() => process.exit(1)); });
module.exports = app;
