const mongoose = require("mongoose");

const users = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    otpHash: String,
    otpExpiresAt: Date,
    otpSentAt: Date,
    otpAttempts: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("User", users);
