const UserSchema = require("../models/user.js");
const { config } = require('dotenv');
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const mongoose = require("mongoose");

config();

const generateJwt = (id, email) => {
    return jsonwebtoken.sign({ id, email }, process.env.SECRET_KEY, {
        expiresIn: "24h",
    });
};

class UserController {
    async reqistration(req, res, next) {
        const { email, password, boss, is_admin } = req.body;

        if (!email || !password) {
            return next({ message: "Incorrect email or password" });
        }

        if (is_admin) {
            const candidate = await UserSchema.findOne({ is_admin: is_admin });
            if (candidate) {
                return next({ message: "Admin user already exists" })
            }
        }
        const candidate = await UserSchema.findOne({ email: email });

        if (candidate) {
            return next({ message: "User with this email already exists" });
        }
        const hashPassword = await bcrypt.hash(password, 5);
        try {
            const user = await UserSchema.create({
                email: email,
                password: hashPassword,
                is_admin: is_admin
            });
        } catch (error) {
            return next(error);
        } 

        if (boss) {
            const candidate_boss = await UserSchema.findById({ _id: boss });
            if (!candidate_boss) {
                return next({ message: "User boss with this id not found" });
            }
            // add sub user   
            try {
                await UserSchema.updateOne({ _id: boss }, { $push: { subordinates: user } },
                    { new: true });
            } catch (error) {
                return next(error);
            }
        }
        return res.json({ message: "Successful" });
    }

    async login(req, res, next) {
        const { email, password } = req.body;
        const user = await UserSchema.findOne({ email: email });
        if (!user) {
            return next({ message: "User is not found" });
        }
        let isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return next({message: "Invalid password entered" });
        }
        const token = generateJwt(user._id, user.email);
        res.cookie('user', email, { signed: true })
        return res.json({ token });
    }

    async get_users(req, res, next) {
        const email = req.signedCookies['user']
        var usersProjection = {
            __v: false,
            password: false
        };

        const user = await UserSchema.findOne({ email: email }, usersProjection);
        if (!user) {
            return next(res.json({ msg: "User is not found" }));
        }
        if (user.is_admin) {
            const users = await UserSchema.find({}, usersProjection);
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

        const user = await UserSchema.findOne({ email: current_email_boss }); // boss
        if (!user) {
            return next({ message: "User is not found" });
        }
        if (user.subordinates.length > 0) {
            // boss
            const user_new_boss = await UserSchema.findOne({ email: email_boss });

            user.subordinates.map(function (obj) {
                var __id = mongoose.mongo.ObjectId(obj);
                user_new_boss.subordinates.push(__id);
                user.subordinates.remove(__id)
            });
            user.save();
            user_new_boss.save();
            return res.json({ "newBoss": user_new_boss });
        }
        return res.json({ message: "User is not boss" });
    }
}

module.exports = new UserController();