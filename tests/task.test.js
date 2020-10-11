const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const Task = require('../src/models/task')
const { populateDatabase, testUser1, testTask1 } = require('./fixtures/db')

// Missing Required Property 'description'
const testTask2 = {
    completed: false,
}

// Use this for update data and second task
const testTask3 = {
    description: 'Test some other Task related stuff',
    completed: true,
}

// Initialize testUser1 before each test for easy db lookups
beforeEach(populateDatabase)

/*
POST request tests
*/

test('Should create task for authenticated user', async () => {
    const { body: { _id } } = await request(app).post('/tasks')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testTask3)
        .expect(201)
    // Asset task was written to db
    expect(_id).not.toBeNull()
})

test('Should reject create task for missing description', async () => {
    await request(app).post('/tasks')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testTask2)
        .expect(400)
})

test('Should reject create task for unauthenticated user', async () => {
    await request(app).post('/tasks')
        .send(testTask3)
        .expect(401)
})

/*
POST request tests
*/

test('Should update task data for authenticated user', async () => {
    await request(app).patch(`/tasks/${testTask1.id}`)
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testTask3)
        .expect(200)
    // Assert that data was written to db
    const { description, completed } = await Task.findById(testTask1.id)
    expect(description).toBe(testTask3.description)
    expect(completed).toBe(testTask3.completed)
})

test('Should reject update task data for unauthenticated user', async () => {
    await request(app).patch(`/tasks/${testTask1.id}`)
        .send(testTask3)
        .expect(401)
})