const Sequelize = require("sequelize");

const ComboTable = require("./combos");
const model = require("./model");
const app = require("./app");
const lib = require("./lib");
const roll = require("./roll");

const { User } = model;
const { UserItem } = model;
const { Item } = model;
const Event = require("./event");

app.get("/slots/roll/:bet", (req, res) => {
  let bet = parseInt(req.params.bet, 10);

  console.log("Rolling the slots with bet:", bet);

  if (!bet || bet < 0) bet = 1;
  else if (bet > 100) bet = 100;

  function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
  }

  UserItem.get(req.session.user, "spin").then(spin => {
    if (spin && spin.value >= bet) {
      console.log("We have enough spins.");
      User.findOne({
        where: {
          id: req.session.user
        }
      }).then(spinsCheckUser => {
        console.log("Spins to go:", spinsCheckUser.behaviorSpins);
        let behaviorPromise = null;

        if (!spinsCheckUser.behaviorSpins) {
          behaviorPromise = User.setBehaviorModel(req.session.user, "normal");
        } else {
          behaviorPromise = User.get(req.session.user);
        }

        behaviorPromise
          .then(userToUpdateSpins => {
            return userToUpdateSpins
              .update(
                {
                  behaviorSpins: Sequelize.literal("behavior_spins - 1")
                },
                {
                  returning: true
                }
              )
              .then(user => {
                user
                  .addItemValue("spin", -bet)
                  .then(() => {
                    user.getBehaviorModel().then(behaviorModel => {
                      Item.getAllByTag("garbage").then(itemTypes => {
                        console.log(
                          "Garbage items to randomize:",
                          itemTypes.length
                        );

                        console.log(
                          "Behaviors model spins:",
                          behaviorModel.spins
                        );
                        console.log("User behavior spins:", user.behaviorSpins);

                        const combosCount = behaviorModel.combos.length;
                        console.log(
                          "The number of fixed combos in the model:",
                          combosCount
                        );

                        const points = behaviorModel.getFixedPoints();

                        const randomSlots = [];
                        while (randomSlots.length < 3) {
                          randomSlots.push(
                            itemTypes[lib.getRandomInt(0, itemTypes.length)]
                              .name
                          );
                        }
                        console.log("Randomly selected slots: ", randomSlots);

                        const usedSpinsCounter =
                          behaviorModel.spins - user.behaviorSpins;
                        console.log(
                          "Spins already made by the user:",
                          usedSpinsCounter
                        );

                        let comboIndexPromise = null;

                        const fixedComboIndex = points.indexOf(
                          usedSpinsCounter
                        );
                        console.log("Fixed combo index: ", fixedComboIndex);

                        if (fixedComboIndex > -1) {
                          console.log(
                            "Using a fixed combo queue:",
                            behaviorModel.combos
                          );
                          // Fixed combo queue:
                          comboIndexPromise = Promise.resolve(
                            behaviorModel.combos[fixedComboIndex]
                          );
                        } else {
                          // Weighted combo selection:
                          // show weights
                          console.log("Weights: ", behaviorModel.weights);
                          const sum = behaviorModel.weights.reduce(
                            (a, b) => a + b,
                            0
                          );
                          console.log("Sum: ", sum);
                          const randomInt = lib.getRandomInt(0, sum);
                          console.log("Random integer: ", randomInt);
                          let border = 0;
                          // TODO: Optimize forEach
                          behaviorModel.weights.forEach((weight, index) => {
                            if (
                              randomInt >= border &&
                              randomInt <= border + weight
                            ) {
                              comboIndexPromise = Promise.resolve(index);
                            }
                            border += weight;
                          });
                        }

                        comboIndexPromise.then(comboIndex => {
                          console.log("Final combo index:", comboIndex);
                          const combo = [...ComboTable[comboIndex]];

                          console.log("Target combo:", combo);

                          combo.forEach((item, index) => {
                            if (item === undefined) {
                              combo[index] = randomSlots[index];
                            }
                          });
                          console.log("Resulting combo:", combo);

                          shuffle(combo);

                          return roll
                            .giveRewards(user.id, comboIndex, bet)
                            .then(rewards => {
                              let coinsReward = 0;

                              rewards.forEach(reward => {
                                if (reward.item === "coin")
                                  coinsReward = reward.value;
                              });

                              let targetPromise = null;
                              if (
                                combo[0] === "attack" &&
                                combo[1] === "attack" &&
                                combo[2] === "attack"
                              ) {
                                targetPromise = roll.chooseAttackTarget(user);
                              } else if (
                                combo[0] === "raid" &&
                                combo[1] === "raid" &&
                                combo[2] === "raid"
                              ) {
                                targetPromise = User.get(user.raidTarget);
                                User.setRaidTarget(user, user.id);
                              } else if (
                                combo[0] === "assist" &&
                                combo[1] === "assist" &&
                                combo[2] === "assist"
                              ) {
                                targetPromise = roll.chooseRaidTarget(
                                  user,
                                  coinsReward
                                );
                              } else if (
                                combo[0] === "assist" &&
                                combo[1] === "assist" &&
                                combo[2] === "assist"
                              ) {
                                targetPromise = roll.chooseAssistTarget(user);
                              } else {
                                targetPromise = Promise.resolve(user);
                              }

                              targetPromise.then(targetedUser => {
                                console.log(
                                  "Returning slots results with target:",
                                  targetedUser.target
                                );

                                res.json({
                                  combo: comboIndex,
                                  slots: combo,
                                  target: targetedUser.target,
                                  targetType: targetedUser.targetType,
                                  rewards
                                });

                                Event.updateAllForUser(user, comboIndex);
                              });
                            });
                        });
                      });
                    });
                  })
                  .catch(error => {
                    res.json({
                      success: false,
                      error
                    });
                  });
              });
          })
          .catch(error => {
            res.json({
              success: false,
              error
            });
          });
      });
    } else {
      res.json({
        success: false,
        error: "There are no spins for such user."
      });
    }
  });
});
