const Sequelize = require("sequelize");

const model = require("./model");

const { ComboReward, UserItem, User } = model;
const { Op } = Sequelize;

module.exports = {
  giveRewards(userId, comboIndex, multiplier = 1) {
    console.log("Giving rewards:", userId, "combo:", comboIndex);
    return User.getVillageLevel(userId).then(level => {
      return ComboReward.findAll({
        where: {
          combo: comboIndex,
          level
        }
      })
        .then(rewards => {
          if (rewards) {
            console.log("Combo index:", comboIndex);
            console.log("Level:", level);
            console.log("Result:", rewards);

            const rewardPromises = [];

            rewards.forEach(reward => {
              const rewardValue = reward.value * multiplier;

              console.log("Reward:", reward.item, "value:", rewardValue);

              rewardPromises.push(
                UserItem.addValue(userId, reward.item, rewardValue).then(() => {
                  return { item: reward.item, value: rewardValue };
                })
              );
            });

            return Promise.all(rewardPromises);
          }
          console.log(
            "Reward not found for combo:",
            comboIndex,
            "on level:",
            level
          );
          return [];
        })
        .catch(error => {
          console.error("Failed to get combo rewards:", error);
        });
    });
  },

  chooseAttackTarget(user) {
    const userId = user.id;
    console.log("Choosing an opponent for an attack:", userId);
    return User.findAll({
      limit: 1,
      order: Sequelize.fn("random"),
      where: {
        id: {
          [Op.ne]: userId
        },
        buildingUpgrades: {
          [Op.gt]: 0
        },
        village: {
          [Op.gte]: user.village - 5,
          [Op.lte]: user.village + 5
        }
      }
    })
      .then(users => {
        let targetPromise = null;

        if (users && users.length > 0) {
          targetPromise = Promise.resolve(users[0]);
          console.log(`Found a matching user for an attack: ${users[0].id}`);
        } else {
          console.log("No user was found for an attack. Generating a bot.");
          targetPromise = User.createBot({
            villageMin: user.village - 5,
            villageMax: user.village + 5
          });
        }

        return targetPromise.then(target => {
          console.log("A random user to attack:", target.id);
          return user
            .update({
              target: target.id,
              targetType: "attack"
            })
            .catch(error => {
              console.error("Error, setting an attack target:", error);
              throw error;
            });
        });
      })
      .catch(error => {
        console.error("Error, finding an attack target:", error);
        throw error;
      });
  },

  chooseRaidTarget(user, budget) {
    const userId = user.id;
    console.log("Choosing an opponent for a raid:", userId);
    return User.findAll({
      limit: 1,
      order: Sequelize.fn("random"),
      where: {
        id: {
          [Op.ne]: userId
        },
        coins: {
          [Op.gte]: budget
        },
        village: {
          [Op.gte]: user.village - 5,
          [Op.lte]: user.village + 5
        }
      }
    })
      .then(users => {
        let targetPromise = null;

        if (users && users.length > 0) {
          targetPromise = Promise.resolve(users[0]);
          console.log(`Found a matching user for a raid: ${users[0].id}`);
        } else {
          console.log("No user was found for an attack. Generating a bot.");
          targetPromise = User.createBot({
            coinsMin: budget,
            villageMin: user.village - 5,
            villageMax: user.village + 5
          });
        }

        return targetPromise.then(target => {
          console.log("A random user to raid:", target.id);
          return target.addItemValue("coin", -budget).then(() => {
            User.sendPush(
              target.id,
              `You were raided by ${user.name} and lost ${budget} coins.`
            );
            return user
              .update({
                target: target.id,
                targetType: "raid"
              })
              .catch(error => {
                console.error("Error, setting a raid target:", error);
                throw error;
              });
          });
        });
      })
      .catch(error => {
        console.error("Error, finding a raid target:", error);
        throw error;
      });
  },

  chooseAssistTarget(user) {
    const userId = user.id;
    console.log("Choosing a friend for an assist:", userId);
    return User.findAll({
      limit: 1,
      order: Sequelize.fn("random"),
      where: {
        id: {
          [Op.ne]: userId
        }
      }
    })
      .then(users => {
        let targetPromise = null;

        if (users && users.length > 0) {
          targetPromise = Promise.resolve(users[0]);
          console.log(`Found a matching user for an assist: ${users[0].id}`);
        } else {
          console.log("No user was found for an assist. Generating a bot...");
          targetPromise = User.createBot();
        }

        return targetPromise.then(target => {
          console.log("A random user to assist:", target.id);
          return user
            .update({
              target: target.id,
              targetType: "assist"
            })
            .catch(error => {
              console.log("Error: ", error);
            });
        });
      })
      .catch(error => {
        console.log("Error: ", error);
      });
  }
};
