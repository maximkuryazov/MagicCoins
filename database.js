const Sequelize = require("sequelize");
const credentials = require("./credentials.json");

let devMode = false;
process.argv.forEach(val => {
  if (val === "dev_mode") devMode = true;
});

const sequelize = new Sequelize(
  devMode ? "postgres" : "magic_coins",
  devMode ? "admin" : "magic",
  credentials.database.password,
  {
    host: "localhost",
    dialect: "postgres",
    logging: false,
    underscored: true
  }
);

module.exports = sequelize;
