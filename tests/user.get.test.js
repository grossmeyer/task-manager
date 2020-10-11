const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const User = require('../src/models/user')
const { populateDatabase, testUser1 } = require('./fixtures/db')

// Initialize testUser1 before each test for easy db lookups
beforeEach(populateDatabase)

/* 
GET request tests
*/

test('Should successfully return profile for authenticated user', async () => {
    await request(app).get('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send()
        .expect(200)
})

test('Should reject profile access for valid user with expired/nonexistent token', async () => {
    // Create a validly created token that shouldn't exist anywhere else but here
    const token = jwt.sign({ id: testUser1.id, iat: Math.floor(Date.now() / 1000 + 1) }, process.env.JWT_SECRET)
    await request(app).get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(401)
})

test('Should reject profile access for unauthenticated user', async () => {
    await request(app).get('/users/profile')
        .send()
        .expect(401)
})

test('Should return profile-pic when requested (if exists)', async () => {
    // Re-add profile pic for retrieval
    await request(app).post('/users/profile-pic')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .attach('profile-pic', 'tests/fixtures/profile-pic.jpg')
    await request(app).get(`/users/${testUser1.id}/profile-pic`)
        .expect(200)
})

test('Should reject profile-pic request if doesn\'t exist', async () => {
    await request(app).get(`/users/${testUser1.id}/profile-pic`)
        .expect(404)
})