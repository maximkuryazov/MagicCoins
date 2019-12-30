const app = require("./app");
const { WofReward } = require("./model");

app.get("/wheel-of-fortune/rewards", (req, res) => {
  WofReward.findAll({
    where: {
      user_id: req.session.user
    }
  })
    .then(rewards => {
      if (rewards && rewards.length > 0) {
        console.log("The rewards list was found:", rewards);
        res.json({
          success: true,
          error: false,
          rewards: rewards[0].rewards
        });
      }
    })
    .catch(error => {
      res.json({
        success: false,
        error: true,
        description: error
      });
    });
});
