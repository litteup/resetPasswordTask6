const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const authRoute = require('./routes/auth');




const app = express();
const port =  process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({extended: true}));



app.use('/v1/auth', authRoute);



// Connect to database

const connect = mongoose.connect(process.env.MONGODBURI);

connect.then((req, res)=>{
    console.log('Connect to MongoDB.')
}).catch((error) =>{
    console.log(`Error while connecting to database.\nError:${error}`);
});


// Connect to server
app.listen(port, ()=>{
    console.log(`Server running on port:${port}`);
});


