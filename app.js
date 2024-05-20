const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const bodyParser = require('body-parser'); 
const createError = require('http-errors');
const { verifyAccessToken } = require('./Helpers/JwtHelper');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const User = require("./Routes/UserRoute");
const Brand = require("./Routes/BrandRoute");
const Store = require("./Routes/StoreRoute");
const Product = require("./Routes/ProductRoute");
const Inventory = require("./Routes/InventoryRoute");
const Cart = require('./Routes/CartRoute');
const Order = require('./Routes/OrderRoute');
const Tag = require('./Routes/TagRoute');
const Category = require('./Routes/CategoryRoute');
const Collection = require('./Routes/CollectionRoute');
const Reservation = require('./Routes/ReservationRoute');
const http = require('http');

// Create HTTP server and initialize Socket.IO
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.json()); // This should be near the top, before your route handlers.

mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('error', err => {
    console.log('Connection failed'); 
});

mongoose.connection.on('connected', () => {
    console.log('Connected with database successfully'); 
});

app.use(cors({
    origin: '*',  // Allow all origins
    credentials: true  // Credentials are supported
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 

app.use('/User', User);
app.use('/Brand', Brand);
app.use('/Store', Store);
app.use('/Product', Product);
app.use('/Inventory', Inventory);
app.use('/Cart', Cart);
app.use('/Order', Order);
app.use('/Tag', Tag);
app.use('/Category', Category);
app.use('/Collection', Collection);
app.use('/Reservation', Reservation);

app.get('/', (req, res) => { 
    res.send('Hello, Azure/Back4App! This is a Node.js application.'); 
}); 

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    });
});

// Socket.IO setup
io.on('connection', (socket) => {
    console.log('a user connected');
    
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// Listen for changes in the Inventory model and emit updates
const InventoryModel = require('./Models/Inventory');
InventoryModel.watch().on('change', (change) => {
    io.emit('inventory-update', change.fullDocument);
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
