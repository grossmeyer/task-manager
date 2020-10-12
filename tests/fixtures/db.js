const request = require('supertest')
const app = require('../../src/app')
const User = require('../../src/models/user')
const Task = require('../../src/models/task')

// User for User tests (and some Task tests)
const testUser1 = {
    name: 'Test User1',
    email: 'grossmeyer+testuser1@gmail.com',
    password: 'tester11',
    id: '',
}

// User for Task tests
const testTaskUser2 = {
    name: 'Test TaskUser2',
    email: 'grossmeyer+testtaskuser2@gmail.com',
    password: 'tester22',
    id: '',
}

// Valid Create Task format
const testTask1 = {
    description: 'Test the Task Routes',
    completed: false,
    id: '',
}

// Task for TaskUser2 tests
const testTask21 = {
    description: 'TaskUser2 First Task',
    completed: true,
    id: '',
}

// Task for TaskUser2 tests
const testTask22 = {
    description: 'TaskUser2 Second Task',
    completed: false,
    id: '',
}

const createUserAndReturnId = async (user) => await request(app).post('/users').send(user)

const createTaskAndReturnId = async (task, userId) => {
    return await request(app).post('/tasks')
        .set('Authorization', await User.getBearerToken(userId))
        .send(task)
}

const populateDatabase = async () => {
    await User.deleteMany()
    await Task.deleteMany()
    const { body: { user: { _id: user1Id } } } = await createUserAndReturnId(testUser1)
    testUser1.id = user1Id
    const { body: { user: { _id: user2Id } } } = await createUserAndReturnId(testTaskUser2)
    testTaskUser2.id = user2Id
    const { body: { _id: task1Id } } = await createTaskAndReturnId(testTask1, testUser1.id)
    testTask1.id = task1Id
    const { body: { _id: task21Id } } = await createTaskAndReturnId(testTask21, testTaskUser2.id)
    testTask21.id = task21Id
    const { body: { _id: task22Id } } = await createTaskAndReturnId(testTask22, testTaskUser2.id)
    testTask22.id = task22Id
}

module.exports = {
    populateDatabase,
    testUser1,
    testTask1,
    testTaskUser2,
}