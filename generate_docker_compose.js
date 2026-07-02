const fs = require('fs');
const yaml = require('js-yaml'); // Need to npm install js-yaml
const ecosystem = require('./ecosystem.config.js');

const composeTemplate = {
  version: '3.8',
  services: {},
  networks: {
    msbross_net: { driver: 'bridge' }
  }
};

ecosystem.apps.forEach(app => {
  const serviceName = app.name;
  let port = '';
  
  if (app.env && app.env.PORT) {
    port = app.env.PORT;
  } else if (app.args && app.args.includes('--port')) {
    const match = app.args.match(/--port (\d+)/);
    if (match) port = match[1];
  }

  // Find corresponding image name by matching logic (replace backend with backend)
  const imageName = `msbross-${serviceName.replace('msbross-', '')}:latest`;

  composeTemplate.services[serviceName] = {
    image: imageName,
    container_name: serviceName,
    restart: 'unless-stopped',
    networks: ['msbross_net']
  };

  if (port) {
    composeTemplate.services[serviceName].expose = [port];
    composeTemplate.services[serviceName].environment = [`PORT=${port}`];
  }
});

fs.writeFileSync('docker-compose.yml', '# Generado autom\u00e1ticamente por Antigravity God Mode\n' + yaml.dump(composeTemplate));
console.log('docker-compose.yml generado exitosamente.');
