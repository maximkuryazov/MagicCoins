module.exports = {
  getRandomInt(min, max) {
    if (Number.isNaN(min)) throw new Error(`Invalid minimum value: ${min}`);
    if (Number.isNaN(max)) throw new Error(`Invalid maximum value: ${max}`);
    return Math.floor(Math.random() * (max - min)) + min;
  },
  arrayToJSON(array) {
    const json = [];
    array.forEach(fs => {
      json.push(fs.toJSON());
    });
    return json;
  }
};
