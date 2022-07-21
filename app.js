//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

const secret = "herewegowithourencryption";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] })

const User = mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
});

app.route("/login")
    .get(function(req,res){
    res.render("login");
    })
    .post(function(req,res){
        const username = req.body.username;
        const password = req.body.password
        User.findOne({email : username},function(err,foundUser){
            if(!err){
                if (foundUser) {
                    if(foundUser.password === password){
                        res.render("secrets");
                    }
                    else{
                        res.send("Check your password");
                    }
                }
                else{
                    res.send("Check your username");
                }
            }
            else{
                console.log(err);
            }
        });
    });

app.route("/register")
    .get(function(req,res){
        res.render("register");
    })
    .post(function(req,res){
        const newUser = new User({
            email : req.body.username,
            password : req.body.password
        });
        newUser.save(function(err){
            if (!err) {
                res.render("secrets")
            }
            else{
                console.log(err);
            }
        });
    });


app.listen(3000,function(){
    console.log("Server is started on port 3000");
})