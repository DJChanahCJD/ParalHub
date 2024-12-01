module.exports = {
  apps: [
    {
      name: 'app',
      script: 'dist/main.js',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_type: 'json',
      merge_logs: true,
    },
  ],
};