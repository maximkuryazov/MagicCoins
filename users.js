const Sequelize = require("sequelize");

const app = require("./app");

const User = require("./user");
const Item = require("./item");
const UserItem = require("./user_item");
const Session = require("./session");
const Friendship = require("./friendship");
const FB = require("./facebook");

const { Op } = Sequelize;

app.get("/users/sort-by/:item", (req, res) => {
  User.findAll({
    order: [[req.params.item, "DESC"]],
    limit: 30
  }).then(users => {
    res.json({
      success: true,
      users
    });
  });
});

app.post("/users/facebook", function assignFacebook(req, res) {
  const { id, token } = req.body;

  if (!id) {
    console.error("No Facebook id provided.");
    res.status(403);
    res.json({
      success: false,
      error: true,
      description: "No Facebook id provided."
    });
  } else if (!token) {
    console.error("No Facebook token provided.");
    res.status(403);
    res.json({
      success: false,
      error: true,
      description: "No Facebook token provided."
    });
  } else {
    User.findOne({
      where: {
        facebook: id
      }
    }).then(user => {
      if (user) {
        if (user.id === req.session.user) {
          console.log("Facebook user is the same as the active one.");
          Session.update(
            {
              facebookToken: token
            },
            {
              where: {
                token: req.session.token
              }
            }
          );

          res.json({
            success: true,
            id: user.id,
            token: req.session.token,
            description: "Facebook is already assigned for your user session."
          });
        } else {
          console.log("An existing Facebook user:", user.facebook);
          Session.update(
            {
              user: user.id,
              facebookToken: token
            },
            {
              where: {
                token: req.session.token
              }
            }
          ).then(session => {
            console.log("Session:", session.token);
            User.destroy({
              where: {
                id: req.session.user
              }
            }).then(() => {
              res.json({
                success: true,
                id: user.id,
                token: req.session.token,
                description: "Facebook id was re-assigned!"
              });
            });
          });
        }
      } else {
        console.log(
          "No existing Facebook user was found:",
          id,
          "Binding to the active user:",
          req.session.user
        );

        FB.api(id, "get")
          .then(response => {
            console.log(response);
            console.log("Setting user name to:", response.name);
            User.update(
              {
                facebook: id,
                name: response.name
              },
              {
                where: {
                  id: req.session.user
                }
              }
            ).then(() => {
              console.log("Facebook id and name were assigned.");
              Session.update(
                {
                  facebookToken: token
                },
                {
                  where: {
                    token: req.session.token
                  }
                }
              );

              console.log("Adding facebook friends...");
              FB.api(`${id}/friends`, "get").then(friendsResponse => {
                console.log(
                  "[Facebook] Got user friends:",
                  friendsResponse.data
                );
                friendsResponse.data.forEach(friend => {
                  console.log("[Facebook] Adding friend:", friend);
                  User.findByFacebook(friend.id).then(friendUser => {
                    if (friendUser) {
                      console.log("Found a user by Facebook:", friendUser.id);
                      Friendship.add(req.session.user, friendUser.id);
                    }
                  });
                });
              });

              res.json({
                success: true,
                error: false,
                id: req.session.user,
                token: req.session.token,
                facebookToken: token,
                description: "Facebook id was assigned."
              });
            });
          })
          .catch(error => {
            console.error("Facebook error:", error.message);
            res.status(500);
            res.json({
              success: false,
              error: true,
              description: `Facebook API error: ${error.message}`
            });
          });
      }
    });
  }
});

app.post("/users", (req, res) => {
  console.log("Creating a new guest user...");
  User.create({}).then(user => {
    console.log("User's auto-generated ID:", user.id);
    Session.create({
      user: user.id
    }).then(session => {
      req.session.user = user.id;
      req.session.token = session.token;
      req.session.save(error => {
        if (!error) {
          console.log(req.session);
          console.log("Setting default item values.");

          // Initial user item values.
          Item.findAll({
            where: {
              initialValue: {
                [Op.gt]: 0
              }
            }
          })
            .then(itemTypes => {
              let final = Promise.resolve();
              if (itemTypes) {
                const promises = [];
                itemTypes.forEach(itemType => {
                  console.log("Creating initial:", itemType.name);
                  promises.push(
                    UserItem.setValue(
                      user.id,
                      itemType.name,
                      itemType.initialValue
                    )
                      .then(() => {
                        console.log("Created initial:", itemType.name);
                      })
                      .catch(itemSetValueError => {
                        console.error("Error:", itemSetValueError);
                      })
                  );
                });
                final = Promise.all(promises);
              }
              final.then(() => {
                User.setBehaviorModel(user.id, "normal");

                res.header("Access-Control-Allow-Credentials", "true");
                res.header("Access-Control-Allow-Origin", "*");
                res.json({
                  success: true,
                  id: user.id,
                  token: session.token,
                  session: req.session.token
                });
              });
            })
            .catch(findItemError => {
              console.error("Error finding an item:", findItemError);
            });
        }
      });
    });
  });
});

app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  User.get(id)
    .then(user => {
      console.log("Returning user information:", user.id);
      res.json(user.toJSON());
    })
    .catch(error => {
      res.status(500);
      res.json({
        status: "error",
        error
      });
    });
});
