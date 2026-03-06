module.exports = () => {
  require("./users");
  require("./sessions");
  require("./items");
  require("./user_items");
  require("./slots");
  require("./events");
  require("./friendships");
  require("./ad_rewards");
  require("./news");

  // Запуск фоновых процессов
  require("./spins_timer").start();
  require("./fixing_timer").start();
};
