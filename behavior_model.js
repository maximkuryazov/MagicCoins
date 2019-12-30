const { BehaviorModel } = require("./model");

const behaviorPointsCache = {};

/**
 * Get a model by its id.
 */
BehaviorModel.get = id => {
  return BehaviorModel.findOne({
    where: {
      id
    }
  })
    .then(model => {
      if (model) return model;
      throw new Error("The behavior model was not found:", id);
    })
    .catch(error => {
      console.error("Failed to get a behavior model:", error);
      throw error;
    });
};

/**
 * Get the fixed spin points of the model.
 */
BehaviorModel.prototype.getFixedPoints = function getFixedPoints() {
  if (behaviorPointsCache[this.id]) return behaviorPointsCache[this.id];
  let i = 0;
  const fixed = this.spins / this.combos.length;
  const points = [];
  let j = 0;
  while (i < this.combos.length) {
    points.push(Math.floor(j));
    j += fixed;
    i += 1;
  }
  console.log("Model:", this.id, "points:", points);
  behaviorPointsCache[this.id] = points;
  return points;
};

module.exports = BehaviorModel;
