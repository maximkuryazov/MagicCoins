const app = require("./app");
const Item = require("./item");

app.get("/items/:name", function getItemByName(req, res) {
  console.log("Getting item information:", req.params.name);
  Item.get(req.params.name)
    .then(item => {
      if (item) {
        console.log("Found item information:", item.name);
        res.json(item.toJSON());
      } else {
        res.status(404).json({
          success: false,
          description: `Item not found: ${req.params.name}`
        });
        console.error("Item not found:", req.params.name);
      }
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        error
      });
    });
});
