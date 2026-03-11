// scripts/check-port.js
const net = require('net');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use on ${HOST}`);
    console.log('\n💡 Solutions:');
    console.log('   1. Kill existing process: kill -9 $(lsof -t -i:' + PORT + ')');
    console.log('   2. Use a different port: PORT=5001 npm run server');
    console.log('   3. Wait a few seconds for OS to release the port');
    process.exit(1);
  }
});

server.once('listening', () => {
  server.close();
  console.log(`✅ Port ${PORT} is available`);
  process.exit(0);
});

server.listen(PORT, HOST);