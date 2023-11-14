/********************************************************************************
*  WEB322 – Assignment 04
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Farhan Sarang Student ID: 172963217 Date: 13/11/2023
*
*  Published URL: ___________________________________________________________
*
********************************************************************************/

const legoData = require("./modules/legoSets");
const path = require("path");

const express = require("express");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(express.static("public"));

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

app.get("*", (req, res) => {
  res
    .status(404)
    .render("404", { message: "The requested page does not exist", req: req });
});

legoData.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`server listening on: ${HTTP_PORT}`);
  });
});
