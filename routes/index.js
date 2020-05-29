const cookieParser= require('cookie-parser');
const express = require("express");

var User = require("./user");
var Cart = require("./cart")

const app = express();
app.use(cookieParser());
module.exports = app=>{
    app.post("/signup",User.createUser);
    app.post("/signin",User.signin);
    app.post("/checkout",Cart.add_to_cart)
    app.get("/checkout",Cart.get_add_to_cart)
    app.post("/add_address",User.authValid,Cart.address)
    app.get("/placed_order",User.authValid,Cart.get_placed_order)
    app.post("/placed_order",User.authValid,Cart.placed_order)
    app.get("/thanks",User.authValid,Cart.get_thanks)
}