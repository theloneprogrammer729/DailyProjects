// from flask import Flask
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const session = require("express-session");
const mongoose = require("mongoose");
// app = Flask(__name__);
const app = express();

mongoose.connect("mongodb://localhost:27017/gifApp", {useNewUrlParser: true, useUnifiedTopology: true})
.then( (r) => {
  console.log("connected to the databse");
})
.catch(e=>console.log(e));

// Gif schema
const gifSchema = new mongoose.Schema({
  title: String,
  url: String,
  imageUrl: String
});
const Model = new mongoose.model("Gifs", gifSchema);

// user schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const UserModel = new mongoose.model("Users", userSchema);

// formatting is ejs, not jinja, not pug... EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// static folder, contains js and css, possibly images too. In this case its convention to name is public
app.set("trust proxy", 1);
app.use(session({
  secret: "dailyproject",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded( {extended: true} ));

app.get("/", async (req, res) => {
  console.log(req.session.user_id);
  console.log(req.session.username);
  // will store gifs here.
  let RESULT = [];

  fetch("https://api.giphy.com/v1/gifs/trending?api_key=Do2KvcrIdYyuEJWNE7dKQ7CNOdEYc7Wp&limit=5&")
  .then( async (r) => {
    // awaiting the promise to be fulfilled, so I can get the full data from the server.
    let data = await r.json();
    // extracting the actual data array from the response
    data = data.data; 
    for (const item of data)
    {
      RESULT.push({
        imageUrl: item.images.original.url,
        imageHeight: item.images.original.height,
        imageWidth: item.images.original.width,
        gifTitle: item.title
      });
    }
    res.render("index", {title: "Home", result: RESULT, username: req.session.username});
  })
  .catch( (e)=>{
    console.log(e);
  });
});


app.post("/", async (req, res) => {
  const { title } = req.body;
  let RESULT = [];

  fetch("https://api.giphy.com/v1/gifs/search?api_key=Do2KvcrIdYyuEJWNE7dKQ7CNOdEYc7Wp&limit=5&q=" + title)
  .then( async (r) => {
    // awaiting the promise to be fulfilled, so I can get the full data from the server.
    let data = await r.json();
    // extracting the actual data array from the response
    data = data.data; 
    for (const item of data)
    {
      RESULT.push({
        imageUrl: item.images.original.url,
        imageHeight: item.images.original.height,
        imageWidth: item.images.original.width,
        gifTitle: item.title
      });
    }
    res.render("index", {title: "Home", result: RESULT, username: req.session.username});
  })
  .catch( (e)=>{
    console.log(e);
  });
});

///////////////// Log IN
// trying to get to the login page
app.get("/login", (req, res) => {
  res.render("enterInformation", {title: "Log In", login: true, username: req.session.username});
});
app.post("/login", (req, res) => {
  console.log(req.session.username);
  console.log(req.session.user_id);
  const { username, password } = req.body;
  // TODO: figure out how to hash the password, and unhas to check
  // check if the user exists
  UserModel.findOne({username: username, password: password})
  .then( (r)=>{
    console.log("THis ran, log in ");
    if(r)
    {
      console.log("Logged in the user");
      // sign the user in...
      req.session.user_id = r._id;
      console.log(req.session.user_id);
      req.session.username = username;
      console.log(req.session.username);

      // redirect the user to the homepage
      res.redirect("/");
    }
    else
    {
      res.send("That is not in our database");
  }).catch(e=>console.log(e))
});

/////////////////// Sign Up
// if person is trying to get to the sign up page
app.get("/signup", (req, res) => {
  res.render("enterInformation", {title: "Sign Up", login:false, username: req.session.username}); 
});
// if person is trying to sign up, via post requset
app.post("/signup", (req, res) => {
  // validate that the confirmation and the password are the same
  const { username, password, confirmation } = req.body;
  if (password != confirmation)
  {
    res.send("Error...The password and confirmation did not match");
  }
  // check if the username does not exist in the prorgam
  UserModel.findOne({username: username})
  .then( (r)=>{
    if (r)
    {
      res.send("Error.... That username already exist.. Try again please.");
    }
    else
    {
      console.log("Signed up the user");
      // does nto exist, so craete the user and redirect as logged in.

      // creating user item, to store in the database
      const tempUser = new UserModel({username: username, password: password});
      // saving to the database
      tempUser.save();

      // storing the users information in the session (cookie?) so that I can use it while he is using the application
      req.session.user_id = tempUser._id;
      req.session.username = username;

      // now redirect the user
      res.redirect("/");
     }
    })
  .catch(e=>console.log(e))
});

//////////////// Sign Out
app.get("/signout", (req, res)=>{
  // signing out the user, same as session.clear() from Flask
  req.session.destroy();
  // redirect the user back to the main page
  res.redirect("/");
});


// If all else fails...
app.get("*", (req, res) => {
  res.send("That does not exist....");
});


app.listen(3000, () => {
  console.log("Listening on port 3000");
});
