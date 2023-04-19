const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

mongoose.connect('mongodb://localhost/logs', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

const logsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  message: String,
});

const Log = mongoose.model('Log', logsSchema);

const FILE_PATH = '/path/to/your/file.log';
const CHUNK_SIZE = 1024; // in bytes

fs.open(FILE_PATH, 'r', (err, fd) => {
  if (err) {
    console.error(`Error opening file: ${err}`);
    process.exit(1);
  }

  let currentPosition = 0;

  // Watch for changes in the file and broadcast to clients
  fs.watchFile(FILE_PATH, () => {
    const stats = fs.statSync(FILE_PATH);
    const readStream = fs.createReadStream(FILE_PATH, {
      start: currentPosition,
      end: stats.size,
    });
    readStream.on('data', (chunk) => {
      const message = chunk.toString();
      Log.create({ message });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      currentPosition += chunk.length;
    });
  });
});

app.use(express.static('client/build'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

server.listen(3000, () => {
  console.log(`Server listening on port 3000`);
});