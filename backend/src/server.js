const app = require('./app');
const { sequelize } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Test DB connection and spin up server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
