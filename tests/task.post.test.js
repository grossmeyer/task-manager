const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { populateDatabase, testUser1 } = require('./fixtures/db')

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
POST request tests
*/

test('Should create task for authenticated user', async () => {
    const { body: { _id, completed } } = await request(app).post('/tasks')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testTask3)
        .expect(201)
    // Asset task was written to db
    expect(_id).not.toBeNull()
    expect(completed).toBe(true)
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