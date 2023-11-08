const express = require('express');
const router = express.Router();
const {userCollection} = require('../schemas/user');
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const {send} = require("../utilities/sendEmail");
const{forgetPasswordCollection} = require("../schemas/forgetPasswords");
const otpGenerator = require('otp-generator');




//Register route

router.post("/register", async(req, res)=>{
    try {
        const salt = bcrypt.genSaltSync(10);

        const harshedPassword = bcrypt.hashSync(req.body.password, salt);

        await userCollection.create({
            username: req.body.username,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            password: harshedPassword
        });

        res.status(201).send("User created successfully");
        
    } catch (error) {
        console.log(`Error while attempting to register a user.\nError:${error}`);

    }
});


// User login

router.post("/login", async (req, res)=>{
    try {
        
    let getUsernameFromDb = await userCollection.findOne({username: req.body.username});


    if(!getUsernameFromDb) return res.send("user-not-found");

   
    let doesPasswordMatch = bcrypt.compareSync(req.body.password,getUsernameFromDb.password);

    if(!doesPasswordMatch) return res.send("Invalid credentials");

    const token = jwt.sign({
        userId : getUsernameFromDb._id,
        username: getUsernameFromDb.username,
        password: getUsernameFromDb.password
    }, process.env.JWT_SECRET);
    
    res.send({
        message: "User signed in.",
        token
    });

        
    } catch (error) {
        console.log(`Error while logging in user.\n${error}`)
    }


});

// Forgot password

router.post("/forget-password", async(req,res)=>{
    try {
        const {email} = req.body;
        

        const user = await userCollection.findOne({email});
        
        if(!user) return res.status(404).send("no-user-found");

        let otp = otpGenerator.generate(6);

        await forgetPasswordCollection.create({
            userId : user._id,
            token: otp
        });

        let mailOptions = {
            from: "donotreply@resetyourpassword.com",
            to: email,
            subject: "Password Reset",
            text: `Reset your password with the 6-digits token below.\nOTP: ${otp}` 
        };

        send.sendMail(mailOptions, (err, result) =>{
            if(err){
                console.log(err);
                res.json("'Error occurred while sending reset email.")
            }else return res.json("Reset email sent successfully.");
        });
    } catch (error) {
        console.log(`Error encountered while resetting password.\n${error}`);

    }

});

// Reset Password

router.put("/password-reset", async(req, res)=> {
    try {
        
        const {token} = req.body;

        const user = await forgetPasswordCollection.findOne({token});

        
        if(!user) return res.status(400).send("Invalid-token");

        const newHashedPassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));

        await userCollection.findByIdAndUpdate(user.userId,{
            password: newHashedPassword
        });

        await forgetPasswordCollection.findOneAndDelete({token});

        res.send({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.log(`Error encountered while attempting to reset email.\n${error}`);
        
        res.status(error.status || 500).send(error.message || "internal-server-error");
    };
});

module.exports = router;