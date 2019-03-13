require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'MyApp',
      script: 'server.js',

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
