const express = require('express');
const app = express();
app.use((req, res, next) => {
  req.url = '/app/jartosdto/';
  next();
});
app.get('/app/jartosdto/', (req, res) => res.send('GET MATCH: ' + req.url));
app.use((req, res) => res.send('NO MATCH: ' + req.url));
const server = app.listen(0, () => {
  const port = server.address().port;
  require('http').get(`http://127.0.0.1:${port}/`, (res) => {
    res.on('data', d => process.stdout.write(d));
    res.on('end', () => process.exit(0));
  });
});
