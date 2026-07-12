const express = require('express');
const app = express();
app.use((req, res, next) => {
  req.url = '/app/jartosdto' + req.url;
  next();
});
app.use('/app/jartosdto', express.static(__dirname + '/www/app/jartosdto'));
const server = app.listen(0, () => {
  const port = server.address().port;
  require('http').get(`http://127.0.0.1:${port}/_next/static/chunks/0yzv9gj~bq2.m.css`, (res) => {
    console.log(res.statusCode);
    process.exit(0);
  });
});
