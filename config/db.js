const mongoose = require('mongoose')

const connectDB = () => {
    if(mongoose.connection.readyState === 1) {
        console.log('MongoDB already connected')
        return
    }
    mongoose.connect(process.env.MongoDB_API_KEY)
        .then(() => {
            console.log('MongoDB connected')
        })
        .catch((err) => {
            console.error('Error connecting to MongoDB:', err)
        })
}

module.exports = connectDB
