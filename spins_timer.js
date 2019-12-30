const Sequelize = require("sequelize");

const { Op } = Sequelize;

const model = require("./model");

const { UserItem } = model;

module.exports = {
  start() {
    console.log("Spins timer started.");
    setInterval(() => {
      UserItem.findAll({
        where: {
          name: "spin",
          value: {
            [Op.lt]: 50
          }
        }
      }).then(items => {
        console.log("Spins were updated:", items.length);
        items.forEach(item => {
          console.log("Updated item:", item.name);
          UserItem.addValue(item.owner, "spin", 1);
        });
      });
    }, 5000 * 60);
  }
};
