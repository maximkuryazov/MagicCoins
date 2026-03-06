const fs = require("fs");

const devMode = process.argv.includes("dev_mode");

const config = {
  devMode,
  port: devMode ? 4000 : 443,
  ssl: !devMode ? {
    key: fs.readFileSync("/etc/letsencrypt/live/magiccoinsgame.com/privkey.pem", "utf8"),
    cert: fs.readFileSync("/etc/letsencrypt/live/magiccoinsgame.com/fullchain.pem", "utf8"),
    passphrase: process.env.pass
  } : null,
  user: "magic"
};

module.exports = config;
