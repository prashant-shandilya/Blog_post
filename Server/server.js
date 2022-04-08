const express = require('express');
const app = express();
const mongoose = require('mongoose');
const crypt = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./Models/user');
const Admin = require('./Models/admin')
const Blog = require('./Models/Blog');
var cors = require('cors');
const Secret = key();
app.use(cors())
app.use(express.json());


var mongoDB = 'mongodb://127.0.0.1/honda';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));



function key(){
    return crypt.randomBytes(16).toString('hex');
}
async function ifTokenValid(data){
    if(data.isAdmin){
        const obj = await Admin.find({email:data.email});

        if(obj.length>0){
            return true;
        }
        else{
            return false;
        }
    }
    else{
        const obj = await User.find({username:data.username});

        if(obj.length>0){
            return true;
        }
        else return false;
    }
}

function authorize(req,res,next){
const check = req.body.token;

if(check==null) return res.json({msg:false,chat:"THE TOKEN PROVIDED WAS EMPTY"})

jwt.verify(check,Secret,(err,user)=>{
    if(err) return res.json({msg:false,chat:"ERROR IN VERYFIYING TOKEN"})
    req.data = user;
    next();
})

}

app.post('/register_user',async (req,res)=>{
    console.log(req.body)
    var count = await User.find({username:req.body.usr}).count();
    console.log(count)
    if(count>0){return res.json({msg:false})}

    var myUser = {};
    myUser.username = req.body.usr;
    myUser.email = req.body.mail;
    myUser.password = req.body.pswrd;
    let obj = new User(myUser);
    await obj.save();

    jbody={};

    jbody.username = req.body.usr;
    jbody.email = req.body.mail;
    jbody.isAdmin = false;
    const accessToken = jwt.sign(jbody,Secret);

    res.json({msg:true,token:accessToken});
})

app.post('/register_admin',authorize,async(req,res)=>{
    if(ifTokenValid(req.data)){
        var obj = new Admin({email:req.body.mail,password:req.body.pswrd});
        await obj.save();
        res.json({msg:true,chat:"A new Admin has been created"})
    }
    else{
        res.json({msg:false,chat:"The token was not verified"});
    }
})


app.post('/login',async (req,res)=>{
    if(!req.body.isAdmin){
    var obj = await User.find({username:req.body.usr});
        // console.log(obj);
    if(obj.length==0){return res.json({msg:false,chat:"Username is wrong"})}

    jbody={};
    jbody.username = obj[0].username;
    jbody.email = obj[0].email;
    jbody.isAdmin = false;
    const accessToken = jwt.sign(jbody,Secret);
        // console.log(req.body.pswrd)
        // console.log(obj.password)
        if(obj[0].password==req.body.pswrd){
           return res.json({msg:true,token:accessToken})
        }
       else{
        res.json({msg:false,chat:"false password"})
       }
    }
    else{
        var obj = await Admin.find({email:req.body.mail});

        if(obj.length==0){return res.json({msg:false,chat:"No such Admin found in DB"})};

        jbody = {};
        jbody.email = obj[0].email;
        jbody.isAdmin = true;

        const accessToken = jwt.sign(jbody,Secret);
        if(obj[0].password==req.body.pswrd){
            return res.json({msg:true,token:accessToken})
        }
        else{
            res.json({msg:false,chat:"Authentication Failed"})
        }
    }
})

app.get('/home',authorize,async (req,res) => {

    const all = await Blog.find();
    console.log(req.data)
    if(ifTokenValid(req.data)){
        return res.json({msg:true,data:all,isAdmin:req.data.isAdmin})
    }
    else{
        res.json({msg:false,chat:"Token was not verified"});
    }
   
})

app.post('/post',authorize,async (req,res)=>{
    
    if(ifTokenValid(req.data)){
        var main = req.body;
        var obj = new Blog(main);
        await obj.save();
        return res.send({msg:true})
    }
    else{
        res.json({msg:false,chat:"The token was not verified"})
    }  
})

app.listen(5000,()=>console.log("Server running on port 5000"));