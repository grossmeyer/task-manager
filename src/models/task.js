const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
}, {
    timestamps: true,
})

// ObjectID checker so mongoose is not required in the router
// The explicit return statement is necessary
taskSchema.statics.checkId = async (id) => { 
    return mongoose.Types.ObjectId.isValid(id)
}

const Task = mongoose.model('Task', taskSchema)

module.exports = Task