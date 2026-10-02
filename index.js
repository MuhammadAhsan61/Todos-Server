const dotenv = require('dotenv')

dotenv.config()

const express = require('express')

const app = express()

const cors = require('cors')

const auth = require('./routes/auth')
const todos = require('./routes/todos')

const connectDB = require('./config/db')

connectDB()


app.use(cors())
app.use(express.json())



app.get('/', (req, res) => {
    res.send('Client Server is running...')
})

app.use('/auth', auth)
app.use('/todo' , todos)

app.listen(9000, (req, res) => {
    console.log(' server is running on port 9000')
})
