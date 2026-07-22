module.exports = {
  apps: [{
    name: "family-tree-app",
    script: "dist/src/main.js",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
    },
  }],
};
