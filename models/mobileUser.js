const mongoose = require("mongoose");

const mobileUserSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, trim: true },
    avatar:String,
    status: { type: String, default: "active" }, // blocked, pending...
    role: { type: String, default: "user" }
}, { timestamps: true });

module.exports = mongoose.model("MobileUser", mobileUserSchema);
