let devMode = false;
process.argv.forEach(val => {
  if (val === "dev_mode") devMode = true;
});

const fs = require("fs");
const https = require("https");
const http = require("http");

require("./users");
require("./sessions");
require("./items");
require("./user_items");
require("./slots");
require("./events");
require("./friendships");
require("./ad_rewards");
require("./news");

require("./spins_timer").start();
require("./fixing_timer").start();

const app = require("./app");

if (!devMode) {
  const privateKey = fs.readFileSync(
    "/etc/letsencrypt/live/magiccoinsgame.com/privkey.pem",
    "utf8"
  );
  const certificate = fs.readFileSync(
    "/etc/letsencrypt/live/magiccoinsgame.com/fullchain.pem",
    "utf8"
  );

  const credentials = {
    key: privateKey,
    cert: certificate,
    passphrase: "322538631abcdE"
  };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443);
}

console.log("========================START========================");

if (devMode) {
  const httpsServer = http.createServer(app);
  httpsServer.listen(4000);
}

if (!devMode) {
  process.setuid("magic");
}
