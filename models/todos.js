const mongoose = require('mongoose')

const todoSchema = new mongoose.Schema({
    uid: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date, default: null }
}, {
    timestamps: true
})

module.exports = mongoose.model('Todo', todoSchema)