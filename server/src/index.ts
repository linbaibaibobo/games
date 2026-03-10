import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import userRoutes from './routes/users';
import cartRoutes from './routes/cart';
import favoriteRoutes from './routes/favorites';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payment';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Global Shop Mall API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
