const app = require("./app");
const News = require("./news-entry");

app.get("/news", (req, res) => {
  News.getAllByUserId(req.session.user)
    .then(newsRow => {
      res.status(200);
      res.json(newsRow);
    })
    .catch(exception => {
      res.status(500);
      res.json({ error: exception });
    });
});

app.get("/news/unread-count", async (req, res) => {
  try {
    const counted = await News.getUnreadCount(req.session.user);
    res.status(200);
    res.json({ counted });
  } catch (exception) {
    res.status(500);
    res.json({ error: exception });
  }
});

app.put("/news/:id", async (req, res) => {
  try {
    const success = await News.markAsRead(req.params.id);
    if (success) {
      res.status(200);
      res.json({ success: success[0] > 0 ? "true" : "false" }); // success[0] - counted rows
    } else {
      res.status(400);
      res.json({ success: false, error: "No such object. ID is incorrect." });
    }
  } catch (exception) {
    res.status(500);
    res.json({ success: false, error: exception });
  }
});
