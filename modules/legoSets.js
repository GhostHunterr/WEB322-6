require("dotenv").config();
const Sequelize = require("sequelize");

let sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });

const Theme = sequelize.define(
  "Theme",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
    },
  },
  {
    timestamps: false, // Disable createdAt and updatedAt fields
  }
);

const Set = sequelize.define(
  "Set",
  {
    set_num: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
    },
    year: {
      type: Sequelize.INTEGER,
    },
    num_parts: {
      type: Sequelize.INTEGER,
    },
    theme_id: {
      type: Sequelize.INTEGER,
    },
    img_url: {
      type: Sequelize.STRING,
    },
  },
  {
    timestamps: false, // Disable createdAt and updatedAt fields
  }
);

Set.belongsTo(Theme, { foreignKey: "theme_id" });

function initialize() {
  return sequelize
    .sync()
    .then(() => {
      // Insert initial data here if needed
      console.log("Database synchronized.");
    })
    .catch((err) => {
      console.error("Error synchronizing database:", err);
      throw err;
    });
}

function getAllSets() {
  return Set.findAll({ include: [Theme] });
}

function getSetByNum(setNum) {
  return Set.findOne({ where: { set_num: setNum }, include: [Theme] });
}

function getSetsByTheme(theme) {
  return Set.findAll({
    include: [Theme],
    where: {
      "$Theme.name$": {
        [Sequelize.Op.iLike]: `%${theme}%`,
      },
    },
  }).then((foundSets) => {
    if (foundSets.length > 0) {
      return foundSets;
    } else {
      throw new Error("Unable to find requested sets");
    }
  });
}

function addSet(setData) {
  return Set.create(setData)
    .then(() => {
      console.log("Set added successfully");
    })
    .catch((err) => {
      throw new Error(err.errors[0].message);
    });
}

function getAllThemes() {
  return Theme.findAll()
    .then((themes) => {
      return themes;
    })
    .catch((err) => {
      throw new Error(err.message);
    });
}

function editSet(setNum, setData) {
  return Set.update(setData, { where: { set_num: setNum } })
    .then(() => {
      console.log(`Set with set_num ${setNum} has been updated.`);
    })
    .catch((err) => {
      console.error(`Error updating set with set_num ${setNum}:`, err);
      throw err;
    });
}

function deleteSet(setNum) {
  return Set.destroy({ where: { set_num: setNum } })
    .then(() => {
      console.log(`Set with set_num ${setNum} has been deleted.`);
    })
    .catch((err) => {
      console.error(`Error deleting set with set_num ${setNum}:`, err);
      throw err;
    });
}
module.exports = {
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  addSet,
  getAllThemes,
  editSet,
  deleteSet,
};
