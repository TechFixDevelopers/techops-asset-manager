module.exports = {
  apps: [
    {
      name: 'techops-asset-manager',
      script: '.next/standalone/server.js',
      cwd: '/opt/techops-asset-manager',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      env_file: '/opt/techops-asset-manager/.env.local',
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/techops/error.log',
      out_file: '/var/log/techops/out.log',
      merge_logs: true,
    },
  ],
};
