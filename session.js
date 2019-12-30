const { Session } = require("./model");

/**
 * Get all of the active sessions for a user.
 */
Session.getAllForUser = user => {
  console.log("Getting all sessions for user:", user);
  return Session.findAll({
    where: {
      user
    }
  });
};

module.exports = Session;
