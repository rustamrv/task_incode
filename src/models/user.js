const pkg = require("mongoose");
const { Schema, model } = pkg;

const UserModel = new Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    is_admin: { type: Boolean, default: false },
    subordinates: [{ type: Schema.Types.ObjectId, ref: 'user', unique:true }]
});

const user = model("user", UserModel);

module.exports = user;