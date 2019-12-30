const model = require("./model");

const { User } = model;

function fix() {
  User.findAll().then(users => {
    if (users) {
      users.forEach(user => {
        console.log("Fixing user:", user.id);
        User.fix(user.id);
      });
    } else {
      console.log("Found no users to fix.");
    }
  });
}

fix();

module.exports = {
  start() {
    console.log("Fixing timer has started.");
    setInterval(() => {
      fix();
    }, 5000 * 60);
  }
};
