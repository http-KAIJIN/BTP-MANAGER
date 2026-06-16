module.exports = {
  apps: [
    {
      name: 'btp-manager-backend',
      script: 'dist/src/main.js',
      instances: process.env.PM2_INSTANCES || '2',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
