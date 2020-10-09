const express = require('express')
require('./db/mongoose')
const User = require('./routers/user')
const Task = require('./routers/task')

const app = express()

app.use(express.json())
app.use(User)
app.use(Task)

module.exports = app