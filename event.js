const Sequelize = require("sequelize");

const { Event } = require("./model");

const { Op } = Sequelize;

const UserItem = require("./user_item");

Event.get = name => {
  console.log("Getting event:", name);
  return Event.findOne({
    where: {
      name
    }
  })
    .then(event => {
      if (event) {
        console.log("Got event:", event.name);
        return event;
      }
      console.error("Failed to find the event:", name);
      throw new Error(`Failed to find the event: ${name}`);
    })
    .catch(error => {
      console.error("Failed to get event:", name, error);
      throw error;
    });
};

Event.getAllActive = () => {
  console.log("Getting all active events.");
  return Event.findAll({
    where: {
      [Op.or]: [
        {
          expiresAt: null
        },
        {
          expiresAt: {
            [Op.gte]: Sequelize.fn("NOW")
          }
        }
      ]
    }
  })
    .then(events => {
      if (events) {
        console.log("Got active events:", events.length);
        return events;
      }
      console.error("Failed to find the events.");
      throw new Error(`Failed to find the events.`);
    })
    .catch(error => {
      console.error("Failed to get events.");
      throw error;
    });
};

Event.getAllActiveForUser = user => {
  console.log("Getting all active events for user:", user);
  return Event.getAllActive()
    .then(events => {
      const filteredEvents = [];
      const eventPromises = [];
      events.forEach(event => {
        eventPromises.push(
          UserItem.get(user, event.name).then(eventItem => {
            if (eventItem.value < event.rewards.length)
              filteredEvents.push(event);
          })
        );
      });
      return Promise.all(eventPromises).then(() => filteredEvents);
    })
    .catch(error => {
      console.error("Failed to get user events.");
      throw error;
    });
};

/**
 * Update the state of all events for the user,
 * and a combo index from the slot machine.
 */
Event.updateAllForUser = (user, comboIndex) => {
  return Event.getAllActiveForUser(user.id).then(events => {
    const promises = [];

    events.forEach(event => {
      // Add event item's value.
      promises.push(
        UserItem.addValue(
          user.id,
          event.item,
          event.combosCounts[comboIndex]
        ).then(eventItem => {
          console.log("New event item value:", eventItem.value);
          console.log("Processing event:", event);
          return UserItem.get(user.id, event.name).then(eventTierItem => {
            if (eventTierItem.value >= event.rewards.length) return null;
            const reward = event.rewards[eventTierItem.value];
            console.log("The active event reward:", reward);
            if (eventItem.value >= reward.goal) {
              // A tier's goal was reached.
              return UserItem.addValue(user.id, event.name, 1).then(
                newEventTierItem => {
                  // Give prize to the user:
                  UserItem.addValue(user.id, reward.item, reward.value).then(
                    () => {
                      if (newEventTierItem.value >= event.rewards.length) {
                        // The end of event was reached for the user.
                        return UserItem.setValue(user.id, eventItem.name, 0);
                      }
                      // Going to the next event tier:
                      return UserItem.setValue(
                        user.id,
                        eventItem.name,
                        eventItem.value - reward.goal
                      );
                    }
                  );
                }
              );
            }
            return null;
          });
        })
      );
    });

    return Promise.all(promises);
  });
};

module.exports = Event;
