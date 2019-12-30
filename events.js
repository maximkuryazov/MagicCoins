const lib = require("./lib");
const app = require("./app");
const Event = require("./event");

app.get("/events", function getItemByName(req, res) {
  const { user } = req.session;
  console.log("Getting active events for user:", user);
  Event.getAllActiveForUser(user)
    .then(events => {
      if (events) {
        res.json({ events: lib.arrayToJSON(events) });
      } else {
        res.status(404);
        console.error("No events were found.");
      }
    })
    .catch(error => {
      console.error("Failed to get active events:", error);
      res.status(500);
      res.json({
        success: false,
        error
      });
    });
});

app.get("/events/:name", function getItemByName(req, res) {
  const { name } = req.params;
  console.log("Getting event information:", name);
  Event.get(name)
    .then(event => {
      if (event) {
        console.log("Found event information:", event.name);
        res.json(event.toJSON());
      } else {
        res.status(404);
        console.error("Event not found:", name);
      }
    })
    .catch(error => {
      res.status(500);
      res.json({
        success: false,
        error
      });
    });
});
