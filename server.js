/********************************************************************************
 *  WEB322 – Assignment 06
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Farhan Sarang Student ID: 172963217 Date: 11/12/2023
 *
 *  Published URL:
 *
 ********************************************************************************/

const express = require("express");
const path = require("path");
const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(
  clientSessions({
    cookieName: "session",
    secret: "r7FpTSOYKweQBZd34c9Vb0i6nDGLlJr",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/lego/sets", async (req, res) => {
  try {
    if (req.query.theme) {
      let sets = await legoData.getSetsByTheme(req.query.theme);
      if (sets.length === 0) {
        res
          .status(404)
          .render("404", { message: "No sets found for the specified theme" });
      } else {
        res.render("sets", { sets, theme: req.query.theme });
      }
    } else {
      let sets = await legoData.getAllSets();
      if (sets.length === 0) {
        res.status(404).render("404", { message: "No sets found" });
      } else {
        res.render("sets", { sets, theme: "All Sets" });
      }
    }
  } catch (err) {
    res.status(404).render("404", {
      message: "I'm sorry, we're unable to find what you're looking for",
    });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    if (!set) {
      res.status(404).render("404", {
        message: "No set found for the specified set number",
      });
    } else {
      res.render("set", { set });
    }
  } catch (err) {
    res.status(404).render("404", {
      message: "I'm sorry, we're unable to find what you're looking for",
    });
  }
});

app.get("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render("addSet", { themes: themes }); // Render the addSet view with themes data
  } catch (err) {
    res.render("500", { message: `Error: ${err}` }); // Render the 500 view if an error occurs
  }
});

// POST route to handle form submission and add a new set
app.post("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    await legoData.addSet(req.body); // Call the addSet function with form data (req.body)
    res.redirect("/lego/sets"); // Redirect to the sets route after successful addition
  } catch (err) {
    res.render("500", { message: `Error: ${err}` }); // Render the 500 view if an error occurs
  }
});

app.get("/lego/editSet/:num", ensureLogin, async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);
    const themes = await legoData.getAllThemes();
    res.render("editSet", { set, themes });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.post("/lego/editSet", ensureLogin, async (req, res) => {
  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/lego/deleteSet/:num", ensureLogin, async (req, res) => {
  try {
    await legoData.deleteSet(req.params.num);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => res.render("register", { successMessage: "User created" }))
    .catch((err) =>
      res.render("register", { errorMessage: err, userName: req.body.userName })
    );
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.get("*", (req, res) => {
  res
    .status(404)
    .render("404", { message: "The requested page does not exist", req: req });
});

legoData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log(`app listening on:  ${HTTP_PORT}`);
    });
  })
  .catch(function (err) {
    console.log(`unable to start server: ${err}`);
  });
