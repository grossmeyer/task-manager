const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be 0 or positive.')
            }
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email must be a valid email address.')
            }
        },
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain the word "password."')
            }
        },
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }],
    profile_pic: {
        type: Buffer,
    },
}, {
    timestamps: true,
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner',
})

// Generate AuthToken for specific user instance
userSchema.methods.generateAuthToken = async function () {
    const token = await jwt.sign({ id: this._id.toString() }, process.env.JWT_SECRET)
    this.tokens = this.tokens.concat({ token })
    await this.save()
    return token
}

// Remove specific data before sending back to user
userSchema.methods.toJSON = function () {
    const user = this.toObject()
    delete user.password
    delete user.tokens
    delete user.profile_pic
    return user
}

// ObjectID checker so mongoose is not required in the router
// The explicit return statement is necessary
userSchema.statics.checkId = async (id) => {
    return mongoose.Types.ObjectId.isValid(id)
}

// User lookup by user/pass combo
userSchema.statics.findByCredentials = async (email, password) => {
    const errorMessage = 'Username or password was not found'
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error(errorMessage)
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error(errorMessage)
    }
    return user
}

userSchema.statics.getBearerToken = async (id) => {
    const { tokens } = await User.findById(id)
    const token = tokens[0].token
    return `Bearer ${token}`
}

// Save password as hash
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }
    next()
})

// Delete associated tasks when user is deleted
userSchema.pre('remove', async function (next) {
    await Task.deleteMany({ owner: this.id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User 