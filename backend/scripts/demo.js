require('dotenv').config({ quiet: true });

const { spawn } = require('node:child_process');
const path = require('node:path');
const mongoose = require('mongoose');
const { resolveDemoUri } = require('../config/demo');
const connectDB = require('../config/db');
const { seedDemoData } = require('./seedDemo');

async function startDemo() {
  process.env.NODE_ENV = 'production';
  process.env.ALLOW_FIRST_RUN_SETUP = 'true';
  process.env.MONGODB_URI = resolveDemoUri({
    demoUri: process.env.DEMO_MONGODB_URI,
    productionUri: process.env.MONGODB_URI,
  });

  await connectDB();
  try {
    await seedDemoData();
  } finally {
    await mongoose.disconnect();
  }

  const server = spawn(process.execPath, [path.join(__dirname, '../bin/www')], {
    stdio: 'inherit',
    env: process.env,
  });

  server.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

if (require.main === module) {
  startDemo().catch((error) => {
    console.error('Errore durante l avvio della demo:', error.message);
    process.exit(1);
  });
}

module.exports = { startDemo };
