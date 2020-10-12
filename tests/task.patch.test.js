const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const Task = require('../src/models/task')
const { populateDatabase, testUser1, testTask1, testTaskUser2 } = require('./fixtures/db')

// Missing Required Property 'description'
const testTask2 = {
    completed: false,
}

// Use this for update data
const testTask3 = {
    description: 'Test some other Task related stuff',
    completed: true,
}

// Initialize testUser1 before each test for easy db lookups
beforeEach(populateDatabase)

/*
PATCH request tests
*/

test('Should update task for authenticated user', async () => {
    await request(app).patch(`/tasks/${testTask1.id}`)
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testTask3)
        .expect(200)
    // Assert that data was written to db
    const { description, completed } = await Task.findById(testTask1.id)
    expect(description).toBe(testTask3.description)
    expect(completed).toBe(testTask3.completed)
})

test('Should reject update task for unauthenticated user', async () => {
    await request(app).patch(`/tasks/${testTask1.id}`)
        .send(testTask3)
        .expect(401)
})

test('Should reject update task for wrong owner of authenticated user', async () => {
    await request(app).patch(`/tasks/${testTask1.id}`)
        .set('Authorization', await User.getBearerToken(testTaskUser2.id))
        .send(testTask3)
        .expect(404)
    // Assert that task description was not updated in db
    expect(testTask1.description).not.toBe(testTask3.description)
})