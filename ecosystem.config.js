module.exports = {
  apps: [
    {
      name: 'aztra-web-2',
      cwd: './',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 0,
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '2G',

      output: '~/logs/pm2/aztra-web-2.log',
      error: '~/logs/pm2/aztra-web-2-error.log',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
