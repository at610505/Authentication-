//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook")
const findOrCreate = require("mongoose-findorcreate")

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret: 'My dark secrets',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate('google',{ scope : ['profile'] }));

app.get("/auth/google/secrets", 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.route("/login")
    .get(function(req,res){
    res.render("login");
    })
    .post(function(req,res){
        const user = new User({
            username : req.body.username,
            password : req.body.password
        });
        req.login(user, function(err) {
            if (err) { 
                console.log(err); 
            }
            else{
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");
                });
            }

          });
    });

app.route("/logout").get(function(req,res){
    req.logOut(function(err){
        if (err) {
            console.log(err);
        }
    });
    res.redirect("/");
});

app.route("/secrets").get(function(req,res){
    if (req.isAuthenticated()) {
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.route("/register")
    .get(function(req,res){
        res.render("register");
    })
    .post(function(req,res){
        User.register({username : req.body.username}, req.body.password , function(err, user) {
            if (err) { 
                console.log(err);
                res.redirect("/register");
            }
            else{
            passport.authenticate("local")(req,res,function() {
              res.redirect("/secrets");
            });

            }

          });

    });


app.listen(3000,function(){
    console.log("Server is started on port 3000");
})