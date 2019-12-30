const { Config } = require("./model");

Config.get = () => {
  return Config.findOrCreate({
    order: [["createdAt", "DESC"]],
    where: {
      id: 1
    }
  }).then(([config]) => config);
};

module.exports = Config;
