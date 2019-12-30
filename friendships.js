const app = require("./app");
const lib = require("./lib");
const Friendship = require("./friendship");

app.post("/friendships/:to", function createFriendship(req, res) {
  const { user } = req.session;
  const to = parseInt(req.params.to, 10);

  Friendship.add(user, to)
    .then(friendship => {
      res.json(friendship.toJSON());
    })
    .catch(error => {
      console.error("Failed to add a friendship:", error);
      res.status(500).json({
        success: false,
        error: true,
        description: error
      });
    });
});

app.get("/friendships", function getFriendships(req, res) {
  const { user } = req.session;

  Friendship.getAll(user)
    .then(friendships => {
      res.json({ friendships: lib.arrayToJSON(friendships) });
    })
    .catch(error => {
      console.error("Failed to get friendships of the user:", error);
      res.status(500).json({
        success: false,
        error: true,
        description: error
      });
    });
});

app.get("/friendships/requests", function getRequests(req, res) {
  const { user } = req.session;

  Friendship.getRequests(user)
    .then(friendships => {
      res.json({ friendships: lib.arrayToJSON(friendships) });
    })
    .catch(error => {
      console.error("Failed to get friend requests of the user:", error);
      res.status(500).json({
        success: false,
        error: true,
        description: error
      });
    });
});

app.get("/friendships/invites", function getInvites(req, res) {
  const { user } = req.session;

  Friendship.getInvites(user)
    .then(friendships => {
      res.json({ friendships: lib.arrayToJSON(friendships) });
    })
    .catch(error => {
      console.error("Failed to get friend invites of the user:", error);
      res.status(500).json({
        success: false,
        error: true,
        description: error
      });
    });
});

app.delete("/friendships/:to", function getFriendships(req, res) {
  const { user } = req.session;
  const to = parseInt(req.params.to, 10);

  console.log("Removing a friendship from:", user, "to:", to);

  Friendship.remove(user, to)
    .then(() => {
      res.json({ success: true });
    })
    .catch(error => {
      console.error("Failed to remove a friendship of the user:", error);
      res.status(500).json({
        success: false,
        error: true,
        description: error
      });
    });
});
