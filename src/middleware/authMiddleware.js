const jsonwebtoken = require("jsonwebtoken");
const { config } = require('dotenv');

config();

function auth(req, res, next){
    if(req.method === 'OPTIONS'){
        next()
    }
    try{
        const token = req.headers.authorization.split(' ')[1]
        if(!token){
            return res.status(401).json({message:"Не авторизован"})
        }
        const decoded = jsonwebtoken.verify(token, process.env.SECRET_KEY)   
        next()
    }catch(e){
        res.status(401).json({message:"Не авторизован"})
    }
}

module.exports = auth;