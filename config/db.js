const mongoose = require('mongoose')

const connectDB = () => {
    mongoose.connect(process.env.MongoDB_API_KEY)
        .then(() => {
            console.log('MongoDB connected')
        })
        .catch((err) => {
            console.error('Error connecting to MongoDB:', err)
        })
}

module.exports = connectDB
