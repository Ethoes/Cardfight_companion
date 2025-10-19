module.exports = {
  apps: [
    {
      name: 'cardfight-backend',
      script: 'python',
      args: 'app.py',
      cwd: './backend',
      env: {
        PORT: 5000,
        PYTHONPATH: './backend',
        HOST: '0.0.0.0'  // Add this
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'cardfight-frontend',
      script: 'serve',
      args: ['-s', 'build', '-l', '3000'],  // localhost only
      cwd: './react_frontend',
      env: {
        PORT: 3000
      },
      watch: false,
      autorestart: true
    }
  ]
};