const Session = require("./session");

const app = require("./app");

app.post("/sessions/info", function assignFacebook(req, res) {
  const { device, pushToken, language } = req.body;

  console.log("Updating the session information:", device, pushToken, language);

  Session.update(
    {
      pushToken,
      device,
      language
    },
    {
      where: {
        token: req.session.token
      },
      returning: true
    }
  ).then(countAndSessions => {
    if (countAndSessions[0]) {
      countAndSessions[1].forEach(session => {
        res.json(session.toJSON());
      });
    }
  });
});
