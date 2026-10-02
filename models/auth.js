const mongoose = require('mongoose');

const { Schema } = mongoose

const schema = new Schema({
    uid: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: false },
    googleId: { type: String, default: null },
    authProvider: { type: String, default: 'local' },
    role: { type: String, default: 'Customer' },
}, { timestamps: true });


const Users = mongoose.model('Users', schema);
module.exports = Users;
