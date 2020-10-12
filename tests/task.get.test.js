const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { populateDatabase, testUser1, testTask1, testTaskUser2 } = require('./fixtures/db')

// Initialize testUser1 before each test for easy db lookups
beforeEach(populateDatabase)

/*
GET request tests
*/

test('Should successfully return tasks for authenticated user', async () => {
    const { body } = await request(app).get('/tasks')
        .set('Authorization', await User.getBearerToken(testTaskUser2.id))
        .expect(200)
    expect(body.length).toBe(2)
})

test('Should reject tasks request for unauthenticated user', async () => {
    await request(app).get('/tasks')
        .expect(401)
})

test('Should successfully return limit of 1 task for authenticated user', async () => {
    const { body } = await request(app).get('/tasks?limit=1')
        .set('Authorization', await User.getBearerToken(testTaskUser2.id))
        .expect(200)
    expect(body.length).toBe(1)
})

test('Should successfully return task for authenticated user', async () => {
    await request(app).get(`/tasks/${testTask1.id}`)
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .expect(200)
})

test('Should reject task request for unauthenticated user', async () => {
    await request(app).get(`/tasks/${testTask1.id}`)
        .expect(401)
})

test('Should reject task request for wrong owner of authenticated user', async () => {
    await request(app).get(`/tasks/${testTask1.id}`)
        .set('Authorization', await User.getBearerToken(testTaskUser2.id))
        .expect(404)
})