const fs = require("fs");
const https = require("https");
const http = require("http");
const app = require("./app");
const load = require("./load");
load();

const devMode = process.argv.includes("dev_mode");

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
    passphrase: process.env.pass
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
