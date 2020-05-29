const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
var favicon = require('serve-favicon')

const morgan = require("morgan");
const Handlebars = require('handlebars');
const exphbs  = require('express-handlebars');
const Swag = require('swag');
const cookieParser= require('cookie-parser');
const session = require('express-session');

var cookie = require('cookie');

var Odoo = require('odoo-xmlrpc');

require("dotenv").config();


Swag.registerHelpers(Handlebars);




const app = express();
hbs = exphbs.create({
    handlebars: Handlebars //Pass the Handlebar instance with Swag
});

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
require("./routes")(app);
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {}
  }))
  app.use(cookieParser());
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

app.use(express.static(path.join(__dirname, '/public')));
app.engine('handlebars', hbs.engine);
app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'handlebars');



// signup
app.get("/signup",function(req,res){
    let decoded="";
    if(req && req.cookies && req.cookies.token){
        decoded = jwt.decode(req.cookies.token);
        if(decoded["name"]){
          res.redirect("/home");
        }else{
          res.render('signup')
        }
    }else{
      res.render('signup')
}});
app.get("/",function(req,res){
    let decoded="";
    if(req && req.cookies && req.cookies.token){
        decoded = jwt.decode(req.cookies.token);
        if(decoded["name"]){
          res.redirect("/home");
        }else{
          res.render('signin')
        }
    }else{
      res.render('signin')
  }
})
app.get("/signin",function(req,res){
  let error = req.query.error;
    let decoded="";
      if(req && req.cookies && req.cookies.token){
          decoded = jwt.decode(req.cookies.token);
          if(decoded["name"]){
            res.redirect("/home");
          }else{
            res.render('signin')
          }
      }else{
        res.render('signin',{error:error})
    }
})
app.get("/home",function(req,res){
    let decoded="";
    if(req && req.cookies && req.cookies.token){
        decoded = jwt.decode(req.cookies.token);
        console.log(decoded)
    }
    
    res.render("home",{name:decoded["name"],home:1,home_logo:1});
})
app.get("/shop",function(req,res){
  let decoded="";
  if(req && req.cookies && req.cookies.token){
      decoded = jwt.decode(req.cookies.token);
      console.log(decoded)
  }
  
  res.render("shop",{name:decoded["name"]});
})
app.get("/video",(req,res)=>{
  let style_id = req.query.style_id;
  let fabric_id = req.query.fabric_id;
  let color_id = req.query.color_id;
  let inp_color_id = req.query.inp_color_id;
  let more_id = req.query.more_id;

  let decoded="";
  console.log(style_id,fabric_id)

  if(!style_id){
    return res.redirect('/shop');
  }else
  if(!fabric_id){
    return res.redirect('/fabric?style='+style_id)
  }else
  if(req && req.cookies && req.cookies.token){
      decoded = jwt.decode(req.cookies.token);
      console.log(decoded);
  }
  
  res.render("video",{name:decoded["name"],style_id:parseInt(style_id),fabric_id:parseInt(fabric_id),color_id:color_id,inp_color_id:inp_color_id,more_id:more_id});
})
app.get("/selected_product",function(req,res){
  console.log(req.body)
  let style_id = req.query.style_id;
  let fabric_id = req.query.fabric_id;
  let decoded="";
  console.log(style_id,fabric_id)

  if(!style_id){
    return res.redirect('/shop');
  }else
  if(!fabric_id){
    return res.redirect('/fabric?style='+style_id)
  }else
  if(req && req.cookies && req.cookies.token){
      decoded = jwt.decode(req.cookies.token);
      console.log(decoded);
  }
  
  res.render("selected_product",{name:decoded["name"],style_id:parseInt(style_id),fabric_id:parseInt(fabric_id)});

})
app.get("/color",(req,res)=>{
  let style_id = req.query.style_id;
  let fabric_id = req.query.fabric_id;
  let decoded="";
  console.log(style_id,fabric_id)

  if(!style_id){
    return res.redirect('/shop');
  }else
  if(!fabric_id){
    return res.redirect('/fabric?style='+style_id)
  }else
  if(req && req.cookies && req.cookies.token){
      decoded = jwt.decode(req.cookies.token);
      console.log(decoded);
  } 
  res.render("color",{name:decoded["name"],style_id:parseInt(style_id),fabric_id:parseInt(fabric_id)});
})

app.get("/add_to_cart",(req,res)=>{
  let style_id = req.query.style_id;
  let fabric_id = req.query.fabric_id;
  let color_id = req.query.color_id;
  let inp_color_id = req.query.inp_color_id;
  let more_id = req.query.more_id;

  let decoded="";
  console.log(style_id,fabric_id)

  if(!style_id){
    return res.redirect('/shop');
  }else
  if(!fabric_id){
    return res.redirect('/fabric?style='+style_id)
  }else if(!color_id){
    return res.redirect(`/color?style_id=${style_id}&&fabric_id=${fabric_id}`)
  }
  if(req && req.cookies && req.cookies.token){
      decoded = jwt.decode(req.cookies.token);
      console.log(decoded);
  }
  
  res.render("add_to_cart",{name:decoded["name"],style_id:parseInt(style_id),fabric_id:parseInt(fabric_id),color_id:color_id,add_color_id:inp_color_id,add_more_id:more_id});

})
app.get("/fabric",function(req,res){
  console.log(req.query.style_id,"--------------");
  let style_id = req.query.style_id;
  let fabric_id = req.query.fabric_id;
  let decoded="";
  if(!style_id){
    return res.redirect('/shop');
  }else
  if(req && req.cookies && req.cookies.token){
      decoded = jwt.decode(req.cookies.token);
      console.log(decoded)
  }
  
  res.render("fabric",{name:decoded["name"],style_id:style_id,fabric_id:fabric_id});
})

app.get("/signout",function(req,res){
    res.clearCookie("token")    
    res.redirect("/signin")
})

app.get("/style_confirm",function(req,res){
  console.log(req.query.style_id,"--------------");
  let style_id = req.query.style_id;
  let fabric_id = req.query.fabric_id;
  let decoded="";
  if(!style_id){
    return res.redirect('/shop');
  }else
  if(req && req.cookies && req.cookies.token){
      decoded = jwt.decode(req.cookies.token);
  }
  
  res.render("style_confirm",{name:decoded["name"],style_id:parseInt(style_id),fabric_id:fabric_id});
})


app.listen(process.env.PORT, console.log("server listening !!!",process.env.PORT));

module.exports = app;
