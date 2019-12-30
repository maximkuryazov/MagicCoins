const app = require("./app");
const credentials = require("./credentials.json");

const UserItem = require("./user_item");

app.get(`/video-reward/${credentials.secretLink}`, function validateAdReward(
  req,
  res
) {
  console.log("Video reward validation:", req.query.userId);
  UserItem.addValue(
    req.query.userId,
    req.query.reward_item,
    req.query.reward_amount
  )
    .then(result => {
      res.json({
        success: true,
        updated: req.query.reward_item,
        quantity: result.value
      });
    })
    .catch(error => {
      console.error("Failed to apply a video reward:", error);
      res.status(500).json({
        success: false
      });
    });
});
