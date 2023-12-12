const mongoose = require("mongoose");
require("dotenv").config();
let Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

function initialize() {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGODB);
    db.on("error", (err) => {
      reject(err);
    });

    db.once("open", () => {
      User = mongoose.model("User", userSchema);
      resolve();
    });
  });
}

function registerUser(userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      const newUser = new User({
        userName: userData.userName,
        password: userData.password,
        email: userData.email,
        loginHistory: [],
      });

      newUser
        .save()
        .then(() => {
          resolve();
        })
        .catch((err) => {
          if (err.code === 11000) {
            reject("User Name already taken");
          } else {
            reject(`There was an error creating the user: ${err}`);
          }
        });
    }
  });
}

function checkUser(userData) {
  return new Promise(function (resolve, reject) {
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          reject(`Unable to find user: ${userData.userName}`);
        } else if (users[0].password !== userData.password) {
          reject(`Incorrect Password for user: ${userData.userName}`);
        } else {
          const user = users[0];

          if (user.loginHistory.length === 8) {
            user.loginHistory.pop();
          }

          user.loginHistory.unshift({
            dateTime: new Date(),
            userAgent: userData.userAgent,
          });

          User.updateOne(
            { userName: user.userName },
            { $set: { loginHistory: user.loginHistory } }
          )
            .then(() => {
              resolve(user);
            })
            .catch((err) => {
              reject(`There was an error verifying the user: ${err}`);
            });
        }
      })
      .catch((err) => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
}

module.exports = {
  initialize,

  registerUser,

  checkUser,
};
