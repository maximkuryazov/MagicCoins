const Sequelize = require("sequelize");

const { Item } = require("./model");

const { Op } = Sequelize;

/**
 * Get an item by its name.
 */
Item.get = name => {
  console.log("Getting item type:", name);
  return Item.findOne({
    where: {
      name
    }
  })
    .then(item => {
      // console.log("Found item type:", item);
      if (item) {
        console.log("Got item type:", item.name);
        return item;
      }
      console.error("Failed to find the item type:", name);
      throw new Error(`Failed to find the item type: ${name}`);
    })
    .catch(error => {
      console.error("Failed to get item:", name, error);
    });
};

/**
 * Get all available items with a specific tag.
 */
Item.getAllByTag = tag => {
  console.log("Getting the item types by tag:", tag);
  return Item.findAll({
    where: {
      tags: {
        [Op.contains]: [tag]
      }
    }
  })
    .then(items => {
      if (items && items.length > 0) return items;
      return [];
    })
    .catch(error => {
      console.error("Failed to get the items by tag:", error);
      throw error;
    });
};

Item.getByTagAndLevel = (tag, level) => {
  console.log("Getting item type by tag:", tag, "level:", level);
  return Item.findOne({
    where: {
      [Op.and]: {
        level,
        tags: {
          [Op.contains]: [tag]
        }
      }
    }
  })
    .then(village => {
      if (village) {
        console.log("Got village:", village.name);
        return village;
      }
      console.error("Village of level not found:", level);
      throw new Error(`Village not found: ${level}`);
    })
    .catch(error => {
      console.error("Failed to get the item:", error);
    });
};

module.exports = Item;
