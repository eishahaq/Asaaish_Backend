const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose');
require('dotenv').config();
const bodyParser = require('body-parser'); 
const createError = require('http-errors')
const { verifyAccessToken } = require('./Helpers/JwtHelper')
const bcrypt = require('bcrypt')
const cors = require('cors');

const User = require("./Routes/UserRoute");
const Store = require("./Routes/StoreRoute")
const Product = require("./Routes/ProductRoute")
// const Customer = require("./Routes/CustomerRoute");

const app = express()


mongoose.set("strictQuery", false);

mongoose.connect('mongodb+srv://eishahaq31:jemC6Y55PSRzhQSi@cluster0.kpsngxl.mongodb.net/');

mongoose.connection.on('error',err => {
    console.log('Connection failed'); 
});

mongoose.connection.on('connected',connected=>{
    console.log('Connected with database sucessfully'); 
})

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); 

app.use(cors({
    origin: true,
    credentials: true
  }));


app.use('/User', User);
app.use('/Store',Store)
app.use('/Product',Product)
// app.use('/Vendor', Vendor);
// app.use('/Customer',Customer);

// In your backend server response handler
// app.use((req,res) => {
// res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
// res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
// res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
// res.setHeader('Access-Control-Allow-Credentials', 'true');
// })


app.get('/', verifyAccessToken, async (req, res, next) => {
    res.send("Hello from express.")
})


app.use((err,req,res,next) => {
    res.status(err.status || 500);
    res.json({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    })
})


const PORT = 3000


app.listen(PORT, () => {
    console.log('Server running on port 3000')
})

module.exports = app;