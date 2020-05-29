var Odoo = require('odoo-xmlrpc');
var cookie = require('cookie');

const jwt = require("jsonwebtoken");
require("dotenv").config();

var odoo = new Odoo({
  url:process.env.url,
  db:process.env.db,
  username: process.env.user_name,
  password: process.env.password
});
console.log(process.env.url,process.env.db,process.env.user_name,
  process.env.password)

const validateusers = (data,res)=>{
    if(!data.phone || !data.password ||!data.confirm_password){
        res.render('signup',{error:"Please enter valid details"});
    }else if(data.phone && data.phone.length !==10){
        res.render('signup',{error:"Mobile number should 10 digits"});
    } else if(data.password !== data.confirm_password){
        res.render('signup',{error:"Current Password should equal to Confirm Password"});
    }else{
        return true
    }
}
const createUser = async(req,res)=>{
    if(await validateusers(req.body,res)){
        odoo.connect(function (err) {
            if (err) { return console.log(err); }
            console.log('Connected to Odoo server.');
            var inParams = [];
            inParams.push([['email', '=', req.body.email]]);
           
            var params = [];
            params.push(inParams);
        
            odoo.execute_kw('res.partner', 'search_read', params, function (err, value) {
                if(err){
                   return res.render('signup',{error:"User not created successfully"})
                }
               if(value &&value["length"] !==0){
                   console.log("User already created");
                   return res.render('signup',{error:"User already exist,Please Signin"})
               }
               else if(value && value["length"]===0 )
                 {
                    var inParams = [];
                    inParams.push({'name':req.body.name,'login': req.body.email, 'new_password':req.body.password,'password':req.body.password,
                    'sel_groups_1_8_9':8
                  });
                    var params = [];
                    params.push(inParams);
                
                    odoo.execute_kw('res.users', 'create', params, function (err, user) {
                        if (err) {  
                            console.log(err,"ERROR on user"); 
                            return res.render('signup',{error:"Please login"})
                        }else{
                            return res.render('signup',{message:"Registered successfully"});
                        }
                    });
                }
               
            });  
        });
    }
    
  
}

const signin = (req,res)=>{
    odoo.connect(function(err){
      if (err) { 
        console.log('Connected to Odoo server.',err);
        return res.render('signin',{error:"oodo connection problem !"})
     }else{
      var inParams = [];
      inParams.push([['email', '=', req.body.email]]);
     
      var params = [];
      params.push(inParams);

      odoo.execute_kw('res.partner', 'search_read', params, function (err, value) {
          if(err){
              console.log(err,"ERROR");
              res.render('signin',{error:"User not found , Please signup"});
          }
          console.log(value,"===")

         if(value &&value["length"] !==0){
             let val = value[0];
             var token =jwt.sign({
               email:val["email"],
               name:val["name"],
               id:val["id"],
               user_id:val["user_ids"],
               commercial_partner_id:val["commercial_partner_id"]
             },process.env.JWT_SECRET,{
              expiresIn: 24 * 60 * 60
            });
            res.cookie('token',token);

            console.log("USER Logged success")
            
          res.redirect('/home');
         }
         else if(value && value["length"]===0 )
          {
              res.render('signin',{error:"User not found , Please signup"});
          }
      });
     }        
        
    })
}

const authValid = function(req, res, next) {
    if (cookie.parse(req.headers.cookie)&& cookie.parse(req.headers.cookie)["token"]) {
      // console.log("DATA VERIFYING OR NOT !!!!!");
      const { exp } = jwt.decode(cookie.parse(req.headers.cookie)["token"]);
      console.log(
        exp < (new Date().getTime() + 1) / 1000,
        "api action authvalid exp"
      );
      if (exp < (new Date().getTime() + 1) / 1000) {
        console.log(exp, "exp");
        console.log("User Expired Auth Valid");
        return res.redirect('/signin?error='+"Please siginin!")
      }
      jwt.verify(
        cookie.parse(req.headers.cookie)["token"],
        process.env.JWT_SECRET,
        (error, decoded) => {
          if (error) {
            console.log(error, "error");
            return res.redirect('/signin?error='+"Please siginin!")
          } else {
            console.log(decoded, "-----------DECODED----------");
            // req.email = decoded;
            var inParams = [];
            inParams.push([['email', '=', decoded.email]]);
           
            var params = [];
            params.push(inParams);
            odoo.connect(function(err){ 
              if(err){
                res.redirect('/signin?error='+"odoo connection problem")
              }else{
                odoo.execute_kw('res.partner', 'search_read', params, function (err, value) {
                  if(err){
                      console.log(err,"ERROR");
                      return res.redirect('/signin?error='+"Please siginin!")                }
                 if(value &&value["length"] !==0){
                  req.decode_data = decoded;
                  return next();
      
                 }
                 else if(value && value["length"]===0 )
                  {
                    return res.redirect('/signin?error='+"Please siginin!")    
                  }
              });
              }
            })            
          }
        }
      );
    } else {
      //console.log("Please login or signup");
      return res.redirect('/signin?error='+"Please siginin!")
    }
};


module.exports ={
    createUser:createUser,
    signin:signin,
    authValid:authValid
}

 
{/* <img src="img/${folder}/${sub_fold}/${img[0]}.png" width="50px"> */}
