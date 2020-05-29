
var Odoo = require('odoo-xmlrpc');
const jwt = require("jsonwebtoken");
var cookie = require('cookie');
var moment = require("moment");

require("dotenv").config();

var odoo = new Odoo({
  url:process.env.url,
  db:process.env.db,
  username: process.env.user_name,
  password: process.env.password
});

const add_to_cart = (req,res)=>{
    let data =[];    let temp ={};
    let decoded="";
    
    var retrieved_cart =[];

    //CHECK DATA IN SESSION STORAGE
    var cart = cookie.parse(req.headers.cookie)["cart"];
    if(cart){
        retrieved_cart =JSON.parse(cart)
    }
    let folder = req.body.folder || "5PocketTwill";
    let sub_fold = req.body.sub_fold || "Ballard";
    let img_0 = req.body.img || 1;
    let img_url = `img/${folder}/${sub_fold}/${img_0}.png`
    //pushed data
    // retrieved_cart.push(data);
    temp.si_no = retrieved_cart.length+1;
    temp.style_name = req.body.style_name
    temp.fabric_name = req.body.fabric_name;
    temp.color = req.body.color;
    temp.waist_size = req.body.waist_size;
    temp.inseam_size = req.body.inseam_size;
    temp.price =  2999;
    temp.quantity = 1
    temp.img_url = img_url;

    data.push(temp);
    console.log(data);
    Array.prototype.push.apply(retrieved_cart,data);
    let total = 0;
    
    retrieved_cart && retrieved_cart.map((k,i)=>{
        total = parseInt(k["price"]) ? parseInt(k["price"]) + total:0;
    })

    //set data to cookies
    res.setHeader('Set-Cookie', cookie.serialize('cart', JSON.stringify(retrieved_cart), {
        // httpOnly: true,
        maxAge: 60 * 60 * 24 * 7 // 1 week
    }));
    // res.setHeader('Set-Cookie', cookie.serialize('total', JSON.stringify(total), {
    //     httpOnly: true,
    //     maxAge: 60 * 60 * 24 * 7 // 1 week
    // }));
    console.log(process.env.NODE_ENV,"NODE")
    
    if (process.env.NODE_ENV === 'local'){
        res.send({
            data:1,
            status:200
        })   
    }
    else{
        res.send({
            data:2,
            status:200
        })        
    }
}
const get_add_to_cart = (req,res)=>{   
   
    odoo.connect(function(err){
      
        if(err){
            return res.render('checkout',{error:"odoo connection problem"})
        }else{
            let decoded="";
            var retrieved_cart =[];
            let message = req.query.message ;
            let error = req.query.error;
           

            //CHECK DATA IN SESSION STORAGE
        var cart = cookie.parse(req.headers.cookie)["cart"];
        if(cart){
            retrieved_cart =JSON.parse(cart);
            console.log(retrieved_cart,"rrr")
        }
        let total =0;
        retrieved_cart && retrieved_cart.map((k,i)=>{
            total = parseInt(k["price"]) ? parseInt(k["price"]+ total):0;
        })

  
        if(req && req.headers.cookie && cookie.parse(req.headers.cookie)["token"]){
            let token = cookie.parse(req.headers.cookie)["token"];
            decoded = jwt.decode(token);

            var inParams = [];
            inParams.push([['email', '=', decoded.email]]);
            inParams.push(['name', 'country_id', 'contact_address','street','state_id','city','zip','mobile'])
            var params = [];
            params.push(inParams);
            
            odoo.execute_kw('res.partner','search_read',params,function(err,value){
                if(err){
                    console.log(err,"getting on checkout")
                    res.render('checkout',{error:"User not found , Please try again"});
                }else{
                    let obj = value[0];
                    let newValue = {};
                    Object.keys(obj).forEach((prop) => {
                      if (obj[prop]) { newValue[prop] = obj[prop]; }
                    });
                    res.render('checkout',{data:retrieved_cart,name:decoded["name"],id:decoded["id"],total:total,message:message,address:newValue,error:error})
                }
            })
            
           
        }else{
            res.render('checkout',{data:retrieved_cart,total:total,message:message,error:error})
        }
            }
            
        })

    
    
}
const address = (req,res)=>{
odoo.connect(function(err){
    let decoded=""; let retrieved_cart=[];
    var cart = cookie.parse(req.headers.cookie)["cart"];
    if(cart){
        retrieved_cart =JSON.parse(cart)
    }
    let total =0;
    retrieved_cart && retrieved_cart.map((k,i)=>{
        total = parseInt(k["price"]) ? parseInt(k["price"]+ total):0;
    })

        if (err) { 
           return res.render('checkout',{error:"oodo connection problem !"})
        }else
        if(req && req.headers.cookie  &&cookie.parse(req.headers.cookie)["token"]){
            let token = cookie.parse(req.headers.cookie)["token"];
            decoded = jwt.decode(token);
            console.log(decoded);
    
            if(decoded){
                var inParams = [];
                inParams.push([decoded.id]); //id to update 
                console.log(req.body)
               inParams.push({
                "mobile":req.body.mobile,
                "name":req.body.name,
                "contact_address":req.body.address,
                "city":req.body.city,
                "street":req.body.area,
                "zip":req.body.pincode
               })
         
                var params = [];
                params.push(inParams);
                odoo.execute_kw('res.partner', 'write', params, function (err, value) {        
                    if(err){
                        console.log(err,"ERROR");
                        res.redirect('/checkout?error='+" Please try again");
                    }else{
                        console.log(value,"Result");
                        res.redirect('/placed_order?message='+"successfully address updated")
                    }
                   
                })
            }
        }else{
            
            return res.render('checkout',{error:"oodo connection problem !"})
        }
    })
}
const placed_order = (req,res)=>{
    odoo.connect(function(err){
        let decoded =""; let retrieved_cart ="";
        if(err){
            return res.render('payment',{error:"oodo connection problem !"})
        }else{
            var cart = cookie.parse(req.headers.cookie)["cart"];
            let token = cookie.parse(req.headers.cookie)["token"];
            decoded = jwt.decode(token);
            if(cart){
                retrieved_cart =JSON.parse(cart)
            }
            if(!retrieved_cart || retrieved_cart["length"] === 0){
                console.log("-------")
                return res.render('payment',{error:"Please select the product"});            
            }else{
                console.log(decoded)
                var inParams = [];
                inParams.push({
                'partner_id': 7,
                // 'company_id':"1",
                // "date_order":'2020-05-18 20:41:45',
                // "client_order_ref":"false",
                // "warehouse_id":  "1" ,
                // 'user_id':14,
                // 'state':'sale',
                // 'note':'sale',
                // "pricelist_id": "1",
                // "currency_id":  'INR' ,
                // 'expected_date': '2020-05-19 07:41:45',
                })
                var params = [];
                params.push(inParams);
                    
                odoo.execute_kw('sale.order','create',params,function(err,order){
                    if(err){
                        console.log(err,"No order created")
                    }
                    else{
                        let total =0;
                        // var inParams1 = [];
    
                        // retrieved_cart && retrieved_cart.map((k,i)=>{
                        //     total = parseInt(k["price"]) ? (parseInt(k["price"])* parseInt(k["quantity"])) + total:0;
                        //     inParams1.push({
                        //         name: k["name"],
                        //         // date_planned :"2020-05-10 08:36:02",
                        //         date_planned:moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
                        //         product_uom:1,
                        //         product_id: i+1,
                        //         product_qty:1,              
                        //         order_id:order,
                        //         price_unit:2999
                        //     })
                        // })
                        // console.log(order,"order")
                        var inParams = [];
                        inParams.push({
                            "product_uom":"1",
                            "product_id": "1",
                            // "product_qty":"1",              
                            "order_id":order,
                            "price_unit":"2999"
                        })
                        
                        var params = [];
                        params.push(inParams);
                        console.log(params,"params")
                        odoo.execute_kw('sale.order.line','create',params,function(error,line){
                        if(error){
                            console.log("No order line created",error)
                        }
                        
                        res.clearCookie('cart');
                        res.clearCookie('total');
    
                        // console.log(line,"line");
                        res.redirect('thanks?order_id='+order)
    
                        })
                    }
                })
            }
       

// order_line = models.execute_kw(db, uid, password, 'purchase.order.line', 'create', [{ 'name': 'NAME TEXT','product_qty': 1, date_planned': ....... 'order_id': new_order}])  
        }
    })
 
}
const get_placed_order = (req,res)=>{
    odoo.connect(function(err){
        let message = req.query.message;
        let error = req.query.error;

        let decoded =""; let retrieved_cart="";
        if(err){
            return res.render('payment',{error:"oodo connection problem !",home:1})
        }else{
            var cart = cookie.parse(req.headers.cookie)["cart"];
            if(cart){
                retrieved_cart =JSON.parse(cart)
            }
            let total =0;
            retrieved_cart && retrieved_cart.map((k,i)=>{
                total = parseInt(k["price"]) ? parseInt(k["price"]+ total):0;
            })

            var cart = cookie.parse(req.headers.cookie)["cart"];
            let token = cookie.parse(req.headers.cookie)["token"];
            
            decoded = jwt.decode(token);
            
            var inParams = [];
            inParams.push([['email', '=', decoded.email]]);
            inParams.push(['name', 'country_id', 'contact_address','state_id','city','zip','mobile']); //fields

            var params = [];
            params.push(inParams);
            odoo.execute_kw('res.partner', 'search_read', params, function (err, value) {
                if(err){
                    res.render('payment',{error:"User not found , Please signin",home:1});
                }
                else{
                    
                    console.log(value,"vvvvvvvvvvv--");
                    let obj = value[0];
                        let newValue = {};
                        Object.keys(obj).forEach((prop) => {
                          if (obj[prop]) { newValue[prop] = obj[prop]; }
                        });
                    return res.render('payment',{data:newValue,total:total,name:decoded["name"],message:message,error:error,home:1})
                }
            })

// order_line = models.execute_kw(db, uid, password, 'purchase.order.line', 'create', [{ 'name': 'NAME TEXT','product_qty': 1, date_planned': ....... 'order_id': new_order}])

           
        }
    })
}
const get_thanks = (req,res)=>{
    let order_id = req.query.order_id;
    let token = cookie.parse(req.headers.cookie)["token"];
            
   let  decoded = jwt.decode(token);
    res.render('thanks',{order_id:order_id,name:decoded["name"]})
}
module.exports ={
    add_to_cart:add_to_cart,
    address:address,
    get_add_to_cart:get_add_to_cart,
    placed_order:placed_order,
    get_placed_order:get_placed_order,
    get_thanks:get_thanks
}

{/* <form action="/checkout" method="POST">
<input type="text" name="style_name" value=${style_name}>
<input type="text" name="fabric_name" value=${fabric_name}>

<input type="text" name="sub_fold_name" value=${sub_fold_name}>
<input type="text" name="waist_size" value=${waist_size}>
<input type="text" name="inseam_size" value=${inseam_size}>
<button type="button" style="background-color: white !important; border-color: white; color:black; text-decoration: underline;">Checkout </button> 
</form> */}
     
{/* <a href="/checkout?style_name=${style_name}&&fabric_name=${}&&color=${}&&waist_size=${}&&inseam_size=${waist_size}" style="font-size:14px; color:grey !important;  text-decoration: underline!important;" >checkout</div> */}

// var xhr = new XMLHttpRequest();
//       xhr.open("POST", '/checkout', true);
//       xhr.setRequestHeader('Content-Type', 'application/json');
//       xhr.send(JSON.stringify({
//         style_name  : style_name,
//         fabric_name: fabric_name,
//         color: sub_fold_name,
//         waist_size: waist_size,
//         inseam_size:inseam_size
//       }));
//       xhr.onload = function(data) {
//         debugger
//         alert(data)
//         console.log("HELLO")
//         console.log(data);
//         window.location.href(data)
//       }