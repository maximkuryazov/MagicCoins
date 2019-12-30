let devMode = false;
process.argv.forEach(val => {
  if (val === "dev_mode") devMode = true;
});

const admin = require("firebase-admin");
const serviceAccount = !devMode
  ? require("./magic-coins-17e1a-firebase-adminsdk-pqb9j-a3308e8855.json")
  : undefined;

if (!devMode) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://magic-coins-testing.firebaseio.com"
  });
}

module.exports = admin;
