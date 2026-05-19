const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB connecté: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`Erreur MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
