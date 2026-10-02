const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    fullName: String,
    password: String,
    role: String,
    expiresAt: Date,
});

module.exports = mongoose.model('Otp', otpSchema);
