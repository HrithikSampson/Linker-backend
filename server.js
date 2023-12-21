const express = require('express');
const cors = require('cors');
const db = require('./database');
const pool = require("./pool");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const secret = "I have a scret";
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send(db);
})
app.get("/",(req,res,next)=>{

})
const verifyMiddleware = (req,res,next) =>{
    const authorizationHeader = req.header("Authorization")
    if(req.user){
        return res.status(401).json({
            sucess: false,
            message: "Invalid Request"
        })
    }
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid authorization header" });
    }
    
    const token = (authorizationHeader.split())[1];
    
    const decode = jwt.verify(token,secret);
    req.user = decode;
    next();
}


app.post('/signup/api', async (req, res) => {    
    
    const saltRounds = 10;
    bcrypt.hash(req.password, saltRounds, async (err, hash) => {

        try{
            await pool.query(
                'INSERT INTO "User"(username,password,email) VALUES($1,$2,$3)',
                [req.username,hash,req.email]
            );
            const token = jwt.sign({payload: {username: req.username}}, secret);
            res.status(200).json({success: true,token});
        }
        catch(err){
            res.status(500).send("Error sending a query");
        }
    });

})
app.post('/login/api', async (req, res) => {    
    

    try{
        const password = (await pool.query(
            'SELECT password FROM "User" WHERE username=$1',
            [req.username]
        ).rows[0].password);
        bcrypt.compare(req.password, password, async (err, result) => {
            if(err){
                console.error(error);
                return res
                .status(401)
                .json({ success: false, message: "Invalid comparing algo" });
            }
            if( !result ) {
                return res
                .status(403)
                .json({ success: false, message: "Unauthorized access" });
            }
            return res
            .status(200)
            .json({
                success: true,
                message: "User is loggedin Successfully. Congrats!"
            });
        })
    }
    catch(err){
        return res
        .status(500)
        .send("Error sending a query");
    }
});



app.post('/extension-data',(req,res)=>{
    console.log(req.body);
    res.status(204).send();
})

app.get('/user/freq', (req, res)=>{
    res.json(
        {websites: ['https://www.google.com', 'https://www.facebook.com', 'https://www.linkedin.com'],
        data: [{id:1, day: '5 days ago', hours: 2}, {id:2, day: '4 days ago', hours: 4}, {id:3, day: '3 days ago', hours: 7}, {id:4, day: '2 days ago', hours: 3}, {id:4, day: '1 day ago', hours: 4}]        
    }
        )
})

app.get('/user/recommendations', (req, res)=>{
    res.json(
        {websites: ['https://www.youtube.com', 'https://www.amazon.in', 'https://twitter.com']}
    )
})
  
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running on "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);