const express = require('express')
require('./db/mongoose')
const User = require('./routers/user')
const Task = require('./routers/task')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(User)
app.use(Task)

app.listen(port, () => {
    console.log('Server is listening on port', port)
})