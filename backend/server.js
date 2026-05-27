import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { initReminderWorker } from './workers/reminderWorker.js';

// Load environment variables
dotenv.config();

// Establish MongoDB connection
connectDB();

const app = express();

// Express configuration & middlewares
app.use(express.json());
app.use(cookieParser());

// Enable CORS with Credentials support for HTTP-Only Cookie transport
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Diagnostic/Healthcheck Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Management System API is healthy and operational',
    timestamp: new Date(),
  });
});

// Route bindings
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Catch-all route not found middleware
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Requested resource not found' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(`[Server Exception] ${err.stack}`);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred',
  });
});

// Boot background reminder workers
initReminderWorker();

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Server] Core server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdowns
process.on('unhandledRejection', (err) => {
  console.error(`[Fatal Shutdown] Unhandled Promise Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
