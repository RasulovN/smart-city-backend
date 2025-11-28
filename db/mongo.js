const mongoose = require('mongoose')
const config = require('../config')

const connectDB = async () => {
    try {
        const uri = config.mongoUrl
        // const uri = config.get("Customer.MONGO_URI")
        const conn = await mongoose.connect(uri)
        console.log(`Mongo db connected: ${conn.connection.host}`)
    } catch (err) {
        console.log(err)
    }
}

module.exports = connectDB