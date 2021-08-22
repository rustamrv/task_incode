const UserModel = require("../models/user.js");
const { config } = require('dotenv');
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const mongoose = require("mongoose");

config();

const generateJwt = (id, email, password) => {
    return jsonwebtoken.sign({ id, email, password }, process.env.SECRET_KEY, {
        expiresIn: "24h",
    });
};

class UserController {
    async reqistration(req, res, next) {
        const { email, password, boss } = req.body;
        let { is_admin } = req.body;
        if (!email || !password) {
            return next(res.json({ msg: "Incorrect email or password" }));
        }
        if (!is_admin) {
            is_admin = false
        }
        const candidate = await UserModel.findOne({ email: email });

        if (candidate) {
            return next(
                res.json({ msg: "User with this email already exists" })
            );
        }
        if (boss) {
            const candidate_boss = await UserModel.findById({ _id: boss });
            if (!candidate_boss) {
                return next(
                    res.json({ msg: "User boss with this id not found" })
                );
            }
            const hashPassword = await bcrypt.hash(password, 5);
            const user = await UserModel.create({
                email: email,
                password: hashPassword,
                is_admin: is_admin
            });
            // add sub user   
            try {
                await UserModel.updateOne({ _id: boss }, { $push: { subordinates: user } },
                    { new: true });
            } catch (error) {
                return next(error);
            }
        } else {
            const hashPassword = await bcrypt.hash(password, 5);
            const user = await UserModel.create({
                email: email,
                password: hashPassword,
                is_admin: is_admin
            });

        }
        return res.json({ msg: "Successful" });
    }

    async login(req, res, next) {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email: email });
        if (!user) {
            return next(res.json({ msg: "User is not found" }));
        }
        let comparePassword = bcrypt.compareSync(password, user.password);
        if (!comparePassword) {
            return next(res.json({ msg: "Invalid password entered" }));
        }
        const token = generateJwt(user._id, user.email, user.password);
        res.cookie('user', email, { signed: true })
        return res.json({ token });
    }

    async get_users(req, res, next) {
        const email = req.signedCookies['user']
        var usersProjection = {
            __v: false,
            password: false 
        };

        const user = await UserModel.findOne({ email: email }, usersProjection);
        if (!user) {
            return next(res.json({ msg: "User is not found" }));
        }
        if (user.is_admin) {
            const users = await UserModel.find({}, usersProjection);
            return res.json(users);
        }
        if (user.subordinates.length > 0) {
            // boss  
            return res.json({ "boss": user });
        }
        return res.json({ "user": user });
    }

    async change_boss(req, res, next) {
        const current_email_boss = req.signedCookies['user']
        const { email_boss } = req.body;

        const user = await UserModel.findOne({ email: current_email_boss }); // boss
        if (!user) {
            return next(res.json({ msg: "User is not found" }));
        }
         if (user.subordinates.length > 0) {
            // boss
            const user_new_boss = await UserModel.findOne({ email: email_boss }); 
       
            user.subordinates.map(function (obj) { 
                var __id = mongoose.mongo.ObjectId(obj); 
                user_new_boss.subordinates.push(__id); 
                user.subordinates.remove(__id)
            });
            user.save();
            user_new_boss.save();
            return res.json({ "newBoss": user_new_boss });
        }
        return res.json({ msg:"User is not boss" });
    }
}

const userCon = new UserController();

module.exports = userCon;