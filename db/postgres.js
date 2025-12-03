const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Connection test function
const connectPostgres = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Prisma) connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

// Graceful shutdown
const disconnectPostgres = async () => {
  await prisma.$disconnect();
  console.log('PostgreSQL disconnected');
};

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectPostgres();
});

module.exports = {
  prisma,
  connectPostgres,
  disconnectPostgres
};
