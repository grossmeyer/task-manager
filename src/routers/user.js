const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendDeleteProfileEmail } = require('../emails/account')
const router = new express.Router()
const upload = multer({
    limits: {
        fileSize: 1_000_000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Accepted file types are: [ .jpg, .jpeg, .png ].'))
        }
        cb(undefined, true)
    }
})

// View user profile
router.get('/users/profile', auth, async (req, res) => res.send(req.user))

// View profile pic
router.get('/users/:id/profile-pic', async ({ params: { id } }, res) => {
    const isValidId = await User.checkId(id)
    if (!isValidId) {
        return res.status(400).send()
    }
    try {
        const user = await User.findById(id)
        if (!user || !user.profile_pic) {
            return res.status(404).send()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.profile_pic)
    } catch (error) {
        res.status(500).send()
    }
})

// Upload profile pic
router.post('/users/profile-pic', auth, upload.single('profile-pic'), async ({ file: { buffer }, user }, res) => {
    const sharpBuffer = await sharp(buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    user.profile_pic = sharpBuffer
    await user.save()
    res.send()
}, ({ message }, req, res, next) => {
    res.status(400).send(message)
})

// Create user and login
router.post('/users', async ({ body }, res) => {
    const user = new User(body)
    try {
        const token = await user.generateAuthToken() // calls user.save()
        await sendWelcomeEmail(user.name, user.email)
        res.status(201).send({ user, token })
    } catch (error) {
        res.status(400).send(error)
    }
})

// Request new JWT and login
router.post('/users/login', async ({ body: { email, password } }, res) => {
    try {
        const user = await User.findByCredentials(email, password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
        console.log(error)
    }
})

// Logout current user session
router.post('/users/logout', auth, async ({ user, token }, res) => {
    try {
        user.tokens = user.tokens.filter(currentToken => {
            return currentToken.token !== token
        })
        await user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// Logout ALL user sessions
router.post('/users/logoutAll', auth, async ({ user }, res) => {
    try {
        user.tokens = []
        await user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// Update user profile data
router.patch('/users/profile', auth, async ({ user, body }, res) => {
    // Create two arrays to compare entered data to valid update properties
    const updateKeys = Object.keys(body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const invalidProperties = updateKeys.filter(key => allowedUpdates.indexOf(key) == -1)
    const isValidOperation = updateKeys.every(key => allowedUpdates.includes(key))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'You may only update name, email, password, or age.', invalidProperties })
    }
    try {
        updateKeys.forEach(key => user[key] = body[key])
        await user.save()

        if (!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (error) {
        console.log('Your request could not be processed.')
        res.status(400).send(error)
    }
})

// Remove user and associated tasks from database
router.delete('/users/profile', auth, async ({ user }, res) => {
    try {
        await user.remove()
        await sendDeleteProfileEmail(user.name, user.email)
        res.send(user)
    } catch (error) {
        res.status(500).send()
    }
})

// Delete user profile picture
router.delete('/users/profile-pic', auth, async ({ user }, res) => {
    try {
        user.profile_pic = undefined
        await user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

module.exports = router