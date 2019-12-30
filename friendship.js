const Sequelize = require("sequelize");

const { Friendship } = require("./model");

const { Op } = Sequelize;

Friendship.add = (from, to) => {
  console.log("Adding a friendship from:", from, "to:", to);
  return Friendship.findOne({
    where: {
      [Op.or]: [{ from, to }, { to: from, from: to }]
    }
  })
    .then(friendship => {
      if (friendship) {
        console.log("Friendship already exists.");
        if (friendship.from !== to) return friendship;
        console.log("Approving an existing friendship...");
        return friendship.update({ approved: true }, { returning: true });
      }
      console.log("Creating a new friendship between users.");
      console.log("Create:", Friendship.create);
      return Friendship.create({ from, to })
        .then(f => {
          console.log("Created a new friendship:", f);
          return f;
        })
        .catch(error => {
          console.error("Failed to create a new friendship:", error);
          throw error;
        });
    })
    .catch(error => {
      console.error("Failed to find an existing friendship:", error);
      throw error;
    });
};

Friendship.remove = (from, to) => {
  console.log("Removing a friendship from:", from, "to:", to);
  return Friendship.findOne({
    where: {
      [Op.or]: [{ from, to }, { to: from, from: to }]
    }
  }).then(friendship => {
    if (friendship) {
      console.log("A friendship was found.");
      console.log("Disapproving a friendship...");
      friendship.destroy();
    }
    return null;
  });
};

Friendship.getAll = user => {
  console.log("Getting all of the friendships of user:", user);
  return Friendship.findAll({
    where: {
      [Op.or]: [{ from: user }, { to: user }],
      [Op.and]: { approved: true }
    }
  })
    .then(friendships => {
      return friendships;
    })
    .catch(error => {
      console.error("Failed to get friendships for user:", user, error);
      throw error;
    });
};

Friendship.getInvites = user => {
  console.log("Getting all of the incoming friendship invitations for:", user);
  return Friendship.findAll({
    where: {
      to: user,
      [Op.and]: { approved: false }
    }
  })
    .then(friendships => {
      return friendships;
    })
    .catch(error => {
      console.error(
        "Failed to get friendship invitations for user:",
        user,
        error
      );
      throw error;
    });
};

Friendship.getRequests = user => {
  console.log("Getting all of the outgoing friendship requests from:", user);
  return Friendship.findAll({
    where: {
      from: user,
      [Op.and]: { approved: false }
    }
  })
    .then(friendships => {
      return friendships;
    })
    .catch(error => {
      console.error(
        "Failed to get friendship requests from user:",
        user,
        error
      );
      throw error;
    });
};

module.exports = Friendship;
