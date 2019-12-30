const Sequelize = require("sequelize");

const { Op } = Sequelize;
const Chance = require("chance");

const lib = require("./lib");
const { User, Item, UserItem } = require("./model");
const Session = require("./session");
const BehaviorModel = require("./behavior_model");

User.tryUpgradeVillage = userId => {
  console.log("Trying to upgrade a village:", userId);
  return Item.get("village").then(villageType => {
    return User.get(userId).then(user => {
      if (user.village >= villageType.maximumValue) {
        console.log(
          "The user is already of maximum village level:",
          user.village
        );
        return user;
      }
      return User.getVillage(user.id).then(village => {
        console.log(
          "Trying to upgrade from village:",
          village.name,
          "buildings:",
          village.components
        );
        const promises = [];
        village.components.forEach(buildingName => {
          promises.push(
            UserItem.get(userId, buildingName).then(building => {
              return Item.get(building.name).then(item => {
                return building.value >= item.maximumValue;
              });
            })
          );
        });

        return Promise.all(promises).then(states => {
          if (states.every(s => s)) {
            console.log("We need to upgrade our village.");
            return UserItem.addValue(userId, "village", 1).then(() => {
              return user.update(
                {
                  buildingUpgrades: 0
                },
                {
                  returning: true
                }
              );
            });
          }
          console.log("The village is still not the maximum level.");
          return user;
        });
      });
    });
  });
};

User.get = id => {
  return User.findOne({
    where: {
      id
    }
  }).catch(error => {
    console.error("Failed to get user:", error);
  });
};

User.findAppropriateRaidTarget = user => {
  return User.findOne({
    where: {
      [Op.and]: [
        {
          village: { [Op.lte]: user.village + 5 }
        },
        {
          village: { [Op.gte]: user.village - 5 }
        }
      ]
    }
  }).then(raidTarget => {
    return raidTarget.id || 0;
  });
};

User.createCompatibleBot = user => {
  return User.createBot({
    villageMin: user.village - 5,
    villageMax: user.village + 5
  }).then(bot => {
    return bot.id;
  });
};

User.setRaidTarget = (user, id) => {
  User.findAppropriateRaidTarget(user).then(async target => {
    console.log("TARGET: ", target);
    let raidTarget = target;
    if (!target) raidTarget = await User.createCompatibleBot(user);
    console.log("TARGET: ", raidTarget);
    return User.update({ raidTarget }, { where: { id } });
  });
};

User.checkRaidTarget = id => {
  return User.get(id)
    .catch(error => {
      console.error("Failed to get user:", error);
    })
    .then(user => {
      if (!user.raidTarget) {
        User.setRaidTarget(user, id);
      }
    });
};

User.fix = id => {
  console.log("Fixing user:", id);
  User.checkRaidTarget(id);
  return User.tryUpgradeVillage(id).then(() => {
    console.log("Fixing user stars:", id);
    return UserItem.getAllByTag(id, "building").then(items => {
      let stars = 0;
      items.forEach(i => {
        stars += i.value;
      });
      UserItem.setValue(id, "star", stars);
    });
  });
};

User.findByFacebook = facebook => {
  return User.findOne({
    where: {
      facebook
    }
  });
};

const chance = new Chance();

User.createBot = function createBot(options = {}) {
  console.log("Creating a bot user:", options);

  return Item.get("village").then(villageType => {
    let villageMin = options.villageMin || 0;
    let villageMax = options.villageMax || 0;
    if (villageMin < 0) villageMin = 0;
    if (villageMax < villageMin) villageMax = villageMin;
    if (villageMax > villageType.maximumValue)
      villageMax = villageType.maximumValue;

    let coinsMin = options.coinsMin || 0;
    let coinsMax = options.coinsMax || 1000000;
    if (coinsMin < 0) coinsMin = 0;
    if (coinsMax < coinsMin) coinsMax = coinsMin;

    return User.create({ name: chance.name() }).then(user => {
      console.log("Created a new bot:", user.name, "id:", user.id);
      return UserItem.addValue(
        user.id,
        "village",
        lib.getRandomInt(villageMin, villageMax)
      ).then(v => {
        console.log("Created a bot with village level:", v.value);
        return User.getVillage(user.id).then(village => {
          const promises = [];
          // Buildings:
          village.components.forEach(buildingName => {
            promises.push(
              Item.get(buildingName).then(building => {
                return UserItem.setValue(
                  user.id,
                  building.name,
                  lib.getRandomInt(0, building.maximumValue)
                );
              })
            );
          });

          // Money.
          promises.push(
            UserItem.addValue(
              user.id,
              "coin",
              lib.getRandomInt(coinsMin, coinsMax)
            )
          );

          return Promise.all(promises).then(() => {
            console.log("Created a bot:", user.id);
            return user;
          });
        });
      });
    });
  });
};

User.getVillageLevel = id => {
  console.log("Getting current village level for user:", id);
  return UserItem.get(id, "village").then(item => item.value);
};

User.getVillage = id => {
  console.log("Getting current village for user:", id);
  return User.getVillageLevel(id).then(level => {
    console.log("Got user item village value:", level);
    return Item.getByTagAndLevel("village", level);
  });
};

User.setBehaviorModel = (id, type) => {
  console.log("Setting behavior:", type, "for user:", id);
  return User.getVillageLevel(id)
    .then(level => {
      console.log("Searching for behavior model for level:", level);
      BehaviorModel.findAll({
        where: {
          type,
          level
        },
        limit: 1,
        order: Sequelize.fn("random")
      })
        .then(behaviorModels => {
          if (behaviorModels && behaviorModels.length > 0) {
            const behaviorModel = behaviorModels[0];
            console.log(
              "Setting the behavior model:",
              behaviorModel.id,
              "for user:",
              id
            );
            return User.update(
              {
                behaviorModel: behaviorModel.id,
                behaviorSpins: behaviorModel.spins
              },
              {
                where: {
                  id
                },
                returning: true
              }
            );
          }
          throw new Error(`Behavior model not found: ${type}, for user ${id}`);
        })
        .catch(error => {
          console.error("Failed to find the behavior model:", error);
          throw error;
        });
    })
    .catch(error => {
      console.error("Failed to get the village level:", error);
      throw error;
    });
};

const push = require("./push");

/**
 * Send a push message for the user.
 */
User.sendPush = (user, message) => {
  return Session.getAllForUser(user)
    .then(sessions => {
      if (sessions) {
        const tokens = [];
        sessions.forEach(session => {
          if (session.pushToken) tokens.push(session.pushToken);
        });

        const pushMessage = {
          notification: {
            title: "Magic Coins",
            body: message
          },
          tokens
        };

        if (tokens.length > 0) {
          return push
            .messaging()
            .sendMulticast(pushMessage)
            .then(response => {
              console.log(
                "[Push] Messages were sent successfully:",
                response.successCount
              );
              console.error(
                "[Push] Messages were not set:",
                response.failureCount
              );
            });
        }
      }
      return null;
    })
    .catch(error => {
      console.error("Failed to send push to user:", user, "error:", error);
    });
};

/**
 * Get the behavior model of the user.
 */
User.prototype.getBehaviorModel = function getBehaviorModel() {
  return BehaviorModel.get(this.behaviorModel);
};

/**
 * Set an item's value.
 */
User.prototype.setItemValue = function setItemValue(name, value) {
  return UserItem.setValue(this.id, name, value);
};

/**
 * Add to an item's value.
 */
User.prototype.addItemValue = function addItemValue(name, delta) {
  return UserItem.addValue(this.id, name, delta);
};

module.exports = User;
