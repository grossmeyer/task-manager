const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const Task = require('../src/models/task')
const { populateDatabase, testUser1, testTask1, testTaskUser2 } = require('./fixtures/db')

// Initialize testUser1 before each test for easy db lookups
beforeEach(populateDatabase)

/*
DELETE request tests
*/

test('Should successfully delete task for authenticated user', async () => {
    await request(app).delete(`/tasks/${testTask1.id}`)
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .expect(200)
    // Assert that task was deleted from db
    const task = await Task.findById(testTask1.id)
    expect(task).toBeNull()
})

test('Should reject delete task for unauthenticated user', async () => {
    await request(app).delete(`/tasks/${testTask1.id}`)
        .expect(401)
})

test('Should reject delete task for wrong owner of authenticated user', async () => {
    await request(app).delete(`/tasks/${testTask1.id}`)
        .set('Authorization', await User.getBearerToken(testTaskUser2.id))
        .expect(404)
    // Assert that task was not deleted from db
    const task = await Task.findById(testTask1.id)
    expect(task).not.toBeNull()
})