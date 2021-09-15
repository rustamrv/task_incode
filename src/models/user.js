const { Schema, model } = require("mongoose"); 

const UserSchema = new Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    is_admin: { type: Boolean, default: false },
    subordinates: [{ type: Schema.Types.ObjectId, ref: 'user', unique:true }]
});
 

module.exports = model("user", UserSchema);