const Sequelize = require("sequelize");

const app = require("./app");
const wss = require("./wss");
const User = require("./user");
const Item = require("./item");
const UserItem = require("./user_item");
const Config = require("./config");
const sequelize = require("./database");

const { Op } = Sequelize;

app.get("/user-items/:owner/:name", (req, res) => {
  const owner = parseInt(req.params.owner, 10);
  const { name } = req.params;

  return UserItem.get(owner, name)
    .then(item => {
      console.log("Got item:", item.name, "value:", item.value);
      if (item) {
        console.log("Returning item:", item.toJSON());
        res.json(item.toJSON());
      } else {
        res.json({
          name,
          value: 0,
          owner,
          broken: false
        });
      }
    })
    .catch(error => {
      res.status(500).json({
        status: "error",
        error: true,
        success: false,
        description: error
      });
    });
});

const env = process.env.NODE_ENV || "development";
if (env === "development") {
  app.post("/user-items/:owner/:name/add-value", (req, res) => {
    const owner = parseInt(req.params.owner, 10);
    const { value } = req.body;
    const { name } = req.params;

    console.log(
      "Add item value for user:",
      owner,
      "item:",
      name,
      "value:",
      value
    );

    Config.get().then(() => {
      User.get(owner).then(user => {
        UserItem.addValue(user.id, name, value).then(item => {
          console.log("Successfully added an item's value:", item.value);
          res.json(item.toJSON());
        });
      });
    });
  });
}

app.post("/user-items/:owner/:name/upgrade", function upgradeItem(req, res) {
  console.log("Upgrading:", req.params.name, "for owner:", req.params.owner);

  // Correct owner id.
  const owner = parseInt(req.params.owner, 10);
  const userId = req.session.user;

  if (userId !== owner) {
    console.error(
      `A user may only upgrade his/her own buildings. ${userId} wanted to upgrade ${owner}.`
    );
    res.status(403).json({
      status: "error",
      error: true,
      success: false,
      description: `A user may only upgrade his/her own buildings: ${userId}`
    });
    return;
  }

  const itemName = req.params.name;
  console.log("Upgrade for user:", userId, "item:", itemName);
  Config.get().then(() => {
    User.get(userId).then(user => {
      UserItem.get(user.id, "coin").then(coin => {
        console.log("Coins available:", coin.value);
        UserItem.get(user.id, itemName).then(building => {
          console.log("Got user item:", building.name);
          Item.get(itemName).then(item => {
            let cost = 0;
            if (building.repairValue)
              cost = item.costs[building.repairValue] / 2;
            else cost = item.costs[building.value];

            if (item.value >= item.maximumValue) {
              console.error(
                "No more upgrades available:",
                itemName,
                "user",
                userId
              );
              res.status(403);
              res.json({
                status: "error",
                error: true,
                success: false,
                description: `No more upgrades available: ${itemName}`
              });
            } else if (coin.value >= cost) {
              console.log("We have enough money for an upgrade.");
              let valueChangePromise = null;
              if (building.repairValue)
                valueChangePromise = UserItem.setValue(
                  userId,
                  itemName,
                  building.repairValue
                );
              else valueChangePromise = UserItem.addValue(userId, itemName, 1);
              valueChangePromise
                .then(newBuilding => {
                  UserItem.addValue(userId, "coin", -cost)
                    .then(() => {
                      return UserItem.addValue(
                        userId,
                        "star",
                        newBuilding.value - building.value
                      )
                        .then(() => {
                          console.log(
                            "Item upgrade has fully finished:",
                            newBuilding.value
                          );
                          res.json(newBuilding.toJSON());
                          console.log(
                            "Checking for maximum:",
                            item.maximumValue
                          );
                          if (newBuilding.value >= item.maximumValue) {
                            User.tryUpgradeVillage(userId);
                          }
                        })
                        .catch(error => {
                          res.status(500);
                          res.json({
                            status: "error",
                            error
                          });
                        });
                    })
                    .catch(error => {
                      res.status(500);
                      res.json({
                        status: "error",
                        error
                      });
                    });
                })
                .catch(error => {
                  res.status(500);
                  res.json({
                    status: "error",
                    error
                  });
                });
            } else {
              console.error("Not enough coins for upgrade!");
              res.status(403);
              res.json({
                status: "error",
                error: "Not enough coins!"
              });
            }
          });
        });
      });
    });
  });
});

app.post("/user-items/:owner/:name/downgrade", (req, res) => {
  const { name } = req.params;
  const owner = parseInt(req.params.owner, 10);

  User.get(req.session.user).then(user => {
    console.log("User:", user.id);
    console.log("Target:", user.target);

    if (owner !== user.target) {
      res.status(403).json({
        success: false,
        error: true,
        description:
          "The current attack target doesn't match the passed user id."
      });
      return;
    }

    if (!user.target) {
      res.status(403).json({
        success: false,
        error: true,
        description: "The attack target is not set."
      });
      return;
    }

    Item.get(req.params.name).then(itemType => {
      if (itemType.tags.indexOf("building") < 0) {
        res.status(403).json({
          success: false,
          error: true,
          description: "Only buildings are allowed to be attacked."
        });
        return;
      }

      UserItem.get(user.target, name).then(item => {
        if (item) {
          UserItem.addValue(owner, name, -1)
            .then(() => {
              console.log("Item attacked!");

              wss.emitChangeEvent([user.id], user.target, name, -1);

              User.sendPush(user.target, `You were attacked by ${user.name}.`);

              UserItem.addValue(owner, "star", -1);

              user
                .update({
                  target: null,
                  targetType: null
                })
                .then(() => {
                  res.json({
                    success: true
                  });
                });
            })
            .catch(error => {
              res.json({
                success: false,
                error: true,
                description: error
              });
            });
        } else {
          res.status(200);
          res.json({
            success: false,
            error: true,
            description: "There is no such item."
          });
        }
      });
    });
  });
});

app.post("/user-items/:owner/:name/open", (req, res) => {
  const owner = parseInt(req.session.user, 10);
  const { name } = req.params;

  console.log("Opening item:", name, "for user:", owner);

  console.log("Opening for user:", owner);
  UserItem.findOne({
    where: {
      owner,
      name,
      value: {
        [Op.gt]: 0
      }
    }
  }).then(item => {
    if (item) {
      if (item.rewards) {
        sequelize
          .transaction(t => {
            const rewardPromises = [];
            item.rewards.forEach(reward => {
              rewardPromises.push(
                UserItem.addValue(owner, reward.item, reward.count, {
                  transaction: t
                })
              );
            });
            return Promise.all(rewardPromises).then(() =>
              UserItem.addValue(owner, name, -1, { transaction: t })
            );
          })
          .catch(() => {
            res.status(500);
            res.json({
              success: false,
              error: true,
              description:
                "Failed to open an item and give rewards to the user."
            });
          });
      } else {
        res.status(403);
        res.json({
          success: false,
          error: true,
          description: "The user has no such item to open."
        });
      }
    } else {
      res.status(404);
      res.json({
        success: false,
        description: "The user has no such item to open."
      });
    }
  });
});

app.get("/items/by-tag/:owner/:tag", function getUserItemsByTag(req, res) {
  const owner = parseInt(req.params.owner, 10);

  Item.findAll({
    attributes: ["name"],
    where: {
      tags: [req.params.tag]
    }
  })
    .then(items => {
      const names = [];

      items.forEach(item => {
        console.log(item.name);
        names.push(item.name);
      });

      UserItem.findAll({
        where: {
          owner,
          [Op.and]: [
            {
              name: names
            }
          ]
        }
      })
        .then(userItems => {
          res.json({
            success: true,
            error: false,
            result: userItems
          });
        })
        .catch(error => {
          res.json({
            success: false,
            error: true,
            description: error
          });
        });
    })
    .catch(error => {
      res.json({
        success: false,
        error: true,
        description: error
      });
    });
});

module.exports = app;
