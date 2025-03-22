module.exports = {
  apps: [
    {
      name: "meetmingle_api",
      script: "npm",
      args: "run start",
    },
    {
      name: "meetmingle_cron",
      script: "npm",
      args: "run start:cron",
    }
  ],
};
