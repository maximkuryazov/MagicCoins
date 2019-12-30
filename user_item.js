const Sequelize = require("sequelize");

const { User, UserItem } = require("./model");
const Item = require("./item");
const wss = require("./wss");

UserItem.get = (owner, name) => {
  console.log("Getting item value:", name, "for owner:", owner);

  if (!owner) throw new Error("Invalid item owner.");
  if (!name) throw new Error("Invalid item name.");

  return UserItem.findOrCreate({
    where: {
      name,
      owner
    },
    defaults: {
      name,
      owner
    }
  }).then(item => item[0]);
};

UserItem.getAllByTag = (owner, tag) => {
  console.log("Getting all user items by tag:", tag, "for owner:", owner);

  if (!owner) throw new Error("Invalid item owner.");
  if (!tag) throw new Error("Invalid item tag.");

  return Item.getAllByTag(tag).then(itemTypes => {
    const items = [];
    itemTypes.forEach(itemType => {
      items.push(UserItem.get(owner, itemType.name));
    });
    return Promise.all(items);
  });
};

UserItem.setValue = (owner, name, _value) => {
  console.log("Setting value: ", owner, name, _value);

  if (!owner) throw new Error("Invalid item owner.");
  if (!name) throw new Error("Invalid item name.");
  if (_value === undefined || _value === null || _value < 0)
    throw new Error(`Invalid item value: ${_value}`);

  return Item.get(name).then(itemType => {
    let value = _value;
    if (_value > itemType.maximumValue) value = itemType.maximumValue;

    let userPromise = null;
    if (name === "coin") {
      userPromise = User.update(
        {
          coins: value
        },
        {
          where: {
            id: owner
          }
        }
      );
    } else if (name === "spin") {
      userPromise = User.update(
        {
          spins: value
        },
        {
          where: {
            id: owner
          }
        }
      );
    } else if (name === "village") {
      userPromise = User.update(
        {
          village: value
        },
        {
          where: {
            id: owner
          }
        }
      );
    } else if (name === "star") {
      userPromise = User.update(
        {
          stars: value
        },
        {
          where: {
            id: owner
          }
        }
      );
    } else {
      userPromise = Promise.resolve();
    }

    return userPromise.then(() => {
      return UserItem.get(owner, name).then(item => {
        // Calculate a real delta value.
        const delta = value - item.value;

        let buildingPromise = Promise.resolve();
        if (itemType.tags && itemType.tags.includes("building")) {
          buildingPromise = buildingPromise.then(() => {
            return User.update(
              {
                buildingUpgrades: Sequelize.literal(
                  `building_upgrades + ${delta}`
                )
              },
              {
                where: {
                  id: owner
                }
              }
            );
          });
        }
        console.log("Setting item:", item.name);
        return buildingPromise.then(() => {
          let newItemPromise = null;
          if (item.repairValue && delta > 0)
            newItemPromise = item.update(
              {
                value,
                broken: false,
                repairValue: null
              },
              {
                returning: true
              }
            );
          else
            newItemPromise = item.update(
              {
                value
              },
              {
                returning: true
              }
            );
          return newItemPromise.then(newItem => {
            console.log(
              "Updated item:",
              newItem.name,
              "new value:",
              newItem.value
            );
            wss.emitChangeEvent(owner, owner, name, delta);
            return item;
          });
        });
      });
    });
  });
};

UserItem.addValue = (owner, name, _delta, options = {}) => {
  console.log("Adding value:", owner, "item:", name, "delta:", _delta);

  if (!owner) throw new Error("Invalid item owner.");
  if (!name) throw new Error("Invalid item name.");
  if (_delta === undefined || _delta === null)
    throw new Error(`Invalid item delta: ${_delta}`);

  return Item.get(name).then(itemType => {
    return UserItem.get(owner, name).then(checkedItem => {
      let delta = _delta;

      // Clamp the delta within a valid range.
      if (
        itemType.maximumValue != null &&
        checkedItem.value + delta > itemType.maximumValue
      )
        delta = itemType.maximumValue - checkedItem.value;
      else if (checkedItem.value + delta < 0) delta = -checkedItem.value;

      let userPromise = null;
      if (name === "coin") {
        userPromise = User.update(
          {
            coins: Sequelize.literal(`coins + ${delta}`)
          },
          {
            where: {
              id: owner
            },
            transaction: options.transaction
          }
        );
      } else if (name === "spin") {
        userPromise = User.update(
          {
            spins: Sequelize.literal(`spins + ${delta}`)
          },
          {
            where: {
              id: owner
            }
          }
        );
      } else if (name === "village") {
        userPromise = User.update(
          {
            village: Sequelize.literal(`village + ${delta}`)
          },
          {
            where: {
              id: owner
            }
          }
        );
      } else if (name === "star") {
        userPromise = User.update(
          {
            stars: Sequelize.literal(`stars + ${delta}`)
          },
          {
            where: {
              id: owner
            }
          }
        );
      } else {
        userPromise = Promise.resolve();
      }

      if (itemType.tags && itemType.tags.includes("building")) {
        userPromise = userPromise.then(() => {
          return User.update(
            {
              buildingUpgrades: Sequelize.literal(
                `building_upgrades + ${delta}`
              )
            },
            {
              where: {
                id: owner
              }
            }
          ).then(u => {
            if (delta < 0)
              return checkedItem.update({ broken: true }).then(() => u);
            return Promise.resolve(u);
          });
        });
      }

      return userPromise.then(() => {
        return UserItem.get(owner, name).then(item => {
          console.log("Adding item: ", item.name);
          return item
            .update(
              {
                value: Sequelize.literal(`value + ${delta}`)
              },
              {
                returning: true
              }
            )
            .then(newItem => {
              console.log(
                "Added item: ",
                newItem.name,
                "new value:",
                newItem.value
              );
              User.sendPush(owner, `Item has changed: ${newItem.name}`);
              wss.emitChangeEvent(owner, owner, name, delta);
              return item;
            });
        });
      });
    });
  });
};

module.exports = UserItem;
