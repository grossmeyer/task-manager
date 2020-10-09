const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt:desc (Default: asc)
router.get('/tasks', auth, async ({ query: { completed, limit = 10, skip = 0, sortBy }, user }, res) => {
    const match = {}
    const sort = {}
    if (completed) {
        match.completed = completed === 'true'
    }
    if (sortBy) {
        const sortTerms = sortBy.split(':')
        sort[sortTerms[0]] = sortTerms[1] === 'desc' ? -1 : 1
    }
    try {
        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(limit),
                skip: parseInt(skip),
                sort,
            },
        }).execPopulate()
        res.send(user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

// View specific task created by user
router.get('/tasks/:id', auth, async ({ params: { id: taskId }, user: { id: ownerId } }, res) => {
    const isValidId = await Task.checkId(taskId)
    if (!isValidId) {
        return res.status(400).send()
    }
    try {
        const task = await Task.findOne({ _id: taskId, owner: ownerId })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

// Save task and write to DB
router.post('/tasks', auth, async ({ user, body }, res) => {
    const task = new Task({
        ...body,
        owner: user.id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.patch('/tasks/:id', auth, async ({ params: { id: taskId }, user: { id: ownerId }, body }, res) => {
    const isValidId = await Task.checkId(taskId)
    if (!isValidId) {
        return res.status(400).send()
    }    
    const updateKeys = Object.keys(body)
    const allowedUpdates = ['description', 'completed']
    const invalidProperties = updateKeys.filter(key => allowedUpdates.indexOf(key) == -1)
    const isValidOperation = updateKeys.every(key => allowedUpdates.includes(key))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'You may only update description or completed.', invalidProperties })
    }
    try {
        const task = await Task.findOne({ _id: taskId, owner: ownerId })
        if (!task) {
            return res.status(404).send()
        }
        updateKeys.forEach(key => task[key] = body[key])
        await task.save()
        res.send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/tasks/:id', auth, async ({ params: { id: taskId }, user: { id: ownerId } }, res) => {
    const isValidId = await Task.checkId(taskId)
    if (!isValidId) {
        return res.status(400).send()
    } 
    try {
        const task = await Task.findOneAndDelete({ _id: taskId, owner: ownerId })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        console.log(error)
    }
})

module.exports = router