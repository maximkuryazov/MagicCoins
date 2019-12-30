const Sequelize = require("sequelize");

const sequelize = require("./database");

const User = sequelize.define(
  "User",
  {
    name: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Имя пользователя. Загружается из Facebook при регистрации."
    },
    facebook: {
      type: Sequelize.STRING,
      unique: "facebook_key",
      allowNull: true,
      comment: "Уникальный идентификатор Facebook."
    },
    behaviorModel: {
      type: Sequelize.INTEGER,
      comment: "Текущая модель поведения."
    },
    behaviorSpins: {
      type: Sequelize.INTEGER,
      comment: "Оставшееся количество вращений в текущей модели поведения."
    },
    village: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Текущий уровень деревни пользователя."
    },
    stars: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Текущее количество звёзд у пользователя."
    },
    coins: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Текущее количество денег пользователя."
    },
    spins: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Текущее количество вращений, доступных пользователю."
    },
    buildingUpgrades: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Сумма всех апгрейдов в текущей деревне."
    },
    target: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    targetType: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    },
    eventLevel: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: "Текущий уровень в текущей акции."
    },
    raidTarget: {
      type: Sequelize.INTEGER,
      comment: "Текущая цель для рейда."
    }
  },
  {
    underscored: true
  }
);

const Session = sequelize.define(
  "Session",
  {
    user: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "Идентификатор пользователя сессии."
    },
    facebookToken: {
      type: Sequelize.STRING,
      comment: "Токен Facebook."
    },
    token: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      allowNull: false,
      primaryKey: true,
      comment: "Уникальный токен сессии."
    },
    pushToken: {
      type: Sequelize.STRING,
      comment: "Токен push сообщений."
    },
    language: {
      type: Sequelize.STRING,
      comment: "Язык пользователя."
    },
    device: {
      type: Sequelize.STRING,
      comment: "Устройство пользователя."
    }
  },
  {
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user", "token"]
      }
    ]
  }
);

const Item = sequelize.define(
  "Item",
  {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
      comment: "Уникальное название предмета."
    },
    initialValue: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment:
        "Начальное значение данного предмета у вновь созданного пользователя."
    },
    maximumValue: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: "Максимальное значение предмета."
    },
    level: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Уровень предмета. Актуально для зданий в деревнях."
    },
    components: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      comment:
        "Предметы, из которых может состоять этот предмет. Актуально для деревень."
    },
    costs: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: null,
      comment: "Стоимости предмета (апгрейдов зданий)."
    },
    rewards: {
      type: Sequelize.ARRAY(Sequelize.JSONB),
      allowNull: true,
      defaultValue: null,
      comment: "Вознаграждения за вскрытие предмета."
    },
    tags: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    }
  },
  {
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["name", "level"]
      }
    ]
  }
);

const UserItem = sequelize.define(
  "UserItem",
  {
    owner: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "Владелец предмета."
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "Название предмета."
    },
    value: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Текущее значение предмета."
    },
    repairValue: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: "Значение предмета при починке."
    },
    broken: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Сломан ли сейчас предмет?"
    }
  },
  {
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["owner", "name"]
      }
    ]
  }
);

const WOFReward = sequelize.define(
  "WOFReward",
  {
    level: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    rewards: {
      type: Sequelize.ARRAY(Sequelize.JSONB),
      allowNull: false,
      validate: {
        isSpecificLength(value) {
          if (value.length !== 8) {
            throw new Error("WoF's rewards must only have eight items.");
          }
        }
      }
    },
    weights: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
      validate: {
        isSpecificLength(value) {
          if (value.length !== 8) {
            throw new Error("WoF's weights must only have eight items.");
          }
        }
      }
    }
  },
  {
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["level"]
      }
    ]
  }
);

const BehaviorModel = sequelize.define(
  "BehaviorModel",
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: Sequelize.STRING
    },
    level: {
      type: Sequelize.INTEGER
    },
    spins: {
      type: Sequelize.INTEGER
    },
    combos: {
      type: Sequelize.ARRAY(Sequelize.INTEGER)
    },
    weights: {
      type: Sequelize.ARRAY(Sequelize.INTEGER)
    }
  },
  {
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["level", "type"]
      }
    ]
  }
);

const ComboReward = sequelize.define(
  "ComboReward",
  {
    level: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "Уровень игрока, получающего приз."
    },
    combo: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "Идентификатор выпадающей комбинации."
    },
    value: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "Количество выдаваемых предметов."
    },
    item: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "Тип предмета вознаграждения."
    }
  },
  {
    underscored: true,
    timestamps: false,
    indexes: [
      {
        fields: ["combo", "level"]
      },
      {
        unique: true,
        fields: ["combo", "level", "item"]
      }
    ]
  }
);

const Cost = sequelize.define(
  "Cost",
  {
    level: {
      type: Sequelize.INTEGER
    },
    cost: {
      type: Sequelize.INTEGER
    },
    name: {
      type: Sequelize.STRING
    }
  },
  {
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["level", "name"]
      }
    ]
  }
);

const Event = sequelize.define(
  "event",
  {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
      comment: "Уникальное название события."
    },
    item: {
      type: Sequelize.STRING,
      comment: "Предмет, собираемый в событии."
    },
    combosCounts: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      comment: "Количество предметов, от каждой комбинации слотов."
    },
    rewards: {
      type: Sequelize.ARRAY(Sequelize.JSONB),
      comment: "Вознаграждения за собранные серии."
    },
    expiresAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: "Срок окончания акции."
    }
  },
  {
    underscored: true
  }
);

const Friendship = sequelize.define(
  "Friendship",
  {
    from: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "Игрок, сделавший запрос на дружбу."
    },
    to: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "Игрок-ответчик, которому был послан запрос на дружбу."
    },
    approved: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Была ли дружба подтверждена ответчиком?"
    }
  },
  {
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["from", "to"]
      }
    ],
    hooks: {
      beforeValidate: friendship => {
        if (friendship.from === friendship.to)
          return Promise.reject(
            new Error("The 'to' and 'from' users must be different.")
          );
        return Friendship.findOne({
          where: {
            from: friendship.to,
            to: friendship.from
          }
        }).then(existing => {
          if (existing)
            return Promise.reject(
              new Error(
                "The reversed friendship already exists:",
                friendship.to,
                "->",
                friendship.from
              )
            );
          return friendship;
        });
      }
    }
  }
);

const Config = sequelize.define("config", {
  repair_cost_factor: {
    type: Sequelize.REAL,
    allowNull: false,
    default: 0.5,
    comment: "Коэффициент цены для починки здания."
  }
});

const NewsEntry = sequelize.define(
  "news",
  {
    type: {
      type: Sequelize.STRING
    },
    createdAt: {
      type: Sequelize.DATE
    },
    read: {
      type: Sequelize.BOOLEAN
    },
    user: {
      type: Sequelize.INTEGER
    },
    source: {
      type: Sequelize.INTEGER
    },
    item: {
      type: Sequelize.INTEGER
    },
    text: {
      type: Sequelize.TEXT
    }
  },
  {
    underscored: true,
    freezeTableName: true
  }
);

console.log("Syncing DB tables...");

User.sync({
  alter: true
});
Session.sync({
  alter: true
});
UserItem.sync({
  alter: true
});
Item.sync({
  alter: true
});
BehaviorModel.sync({
  alter: true
});
ComboReward.sync({
  alter: true
});
Cost.sync({
  alter: true
});
WOFReward.sync({
  alter: true
});
Event.sync({
  alter: true
});
Friendship.sync({
  alter: true
});
Config.sync({
  alter: true
});
NewsEntry.sync({
  alter: true
});

module.exports = {
  User,
  Session,
  UserItem,
  Item,
  BehaviorModel,
  ComboReward,
  Cost,
  WOFReward,
  Event,
  Friendship,
  Config,
  NewsEntry
};
