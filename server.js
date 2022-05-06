require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const {validBody,result}=require('express-validator');
const validator = require("validator");
const bodyParser = require("body-parser");
const mongoose =require("mongoose")
// Basic Configuration

const port = process.env.PORT || 3000;

mongoose.connect("mongodb+srv://shellparse:Mido1991@cluster0.h4jib.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true})
.then((result)=>{console.log("databaseName: "+result.connections[0].name)},(err)=>console.error(err));
let db = mongoose.connection;
db.on("error",(err)=>console.error(err));

let urlSchema = new mongoose.Schema({originalurl: {type:String,required:true},
                                      shorturl:{type:Number}});
let Url = mongoose.model("Url",urlSchema);


let counterSchema = new mongoose.Schema({count:Number});
let Counter = mongoose.model("Counter",counterSchema);
let counter;

async function makeShort(req,res){ 
  await Url.find({originalurl:req.body.url}).then(async (result)=>{if(result.length===0){
    await Counter.find().then(async(result)=> {counter = result[0].count;
      result[0].count++
      await result[0].save();}).catch((err)=> {throw err});
    Url.create({originalurl:req.body.url,shorturl:counter},(err,result)=>{
      if(err) throw err;
      if (result) {
        res.json({original_url:result.originalurl ,short_url:result.shorturl});
    }
  })
  }
  else{
    console.log("entry already exists");
    res.json({original_url:result[0].originalurl,short_url:result[0].shorturl});
  }
}).catch((err)=>console.error(err));
}
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
// Your first API endpoint
app.get('/api/shorturl/:code', function(req, res) {
Url.findOne({shorturl:req.params.code},"originalurl",(err,result)=>{
  if (err) throw err;
  if (result){
    res.redirect(result.originalurl);
  }else{
    res.json({error:"short link not found"})
  }
})
});

app.post('/api/shorturl', function (req,res){
    if (/^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/i.test(req.body.url)){
      makeShort(req,res);
      }else{
        res.json({error:"invalid url"})
 }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
