const { NewsEntry } = require("./model");

NewsEntry.getById = newsId => {
  return NewsEntry.findOne({
    where: {
      id: newsId
    }
  })
    .then(newRow => {
      return newRow.toJSON();
    })
    .catch(error => {
      return error;
    });
};

NewsEntry.create = (type = "", to = 0, from = 0, item = 0, text = "") => {
  return NewsEntry.create({
    type,
    read: false,
    user: to,
    source: from,
    item,
    text
  });
};

NewsEntry.getAllByUserId = userId => {
  return NewsEntry.findAll({
    where: {
      user: userId
    },
    order: [["updatedAt", "DESC"]]
  });
};

NewsEntry.remove = newsId => {
  return NewsEntry.destroy({
    where: {
      id: newsId
    }
  });
};

NewsEntry.markAsRead = newsId => {
  return NewsEntry.update({ read: true }, { where: { id: newsId } }).then(
    success => {
      return success;
    }
  );
};

NewsEntry.getUnreadCount = userId => {
  return NewsEntry.count({ where: { read: false, user: userId } }).then(
    counted => {
      console.log("Number of unreaded news: ", counted);
      return counted;
    }
  );
};

module.exports = NewsEntry;
