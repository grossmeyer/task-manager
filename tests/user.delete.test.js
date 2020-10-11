const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const User = require('../src/models/user')
const { populateDatabase, testUser1 } = require('./fixtures/db')

// Initialize testUser1 before each test for easy db lookups
beforeEach(populateDatabase)

/* 
DELETE request tests
*/

test('Should successfully delete profile-pic for authenticated user', async () => {
    await request(app).delete('/users/profile-pic')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send()
        .expect(200)
    // Assert that profile-pic was deleted from db
    const user = await User.findById(testUser1.id)
    expect(user.profile_pic).toBeUndefined()
})

test('Should reject delete profile-pic for unauthenticated user', async () => {
    await request(app).delete('/users/profile-pic')
        .send()
        .expect(401)
})

test('Should successfully delete user for authenticated user', async () => {
    await request(app).delete('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send()
        .expect(200)
    // Assert that user was deleted from db
    const user = await User.findById(testUser1.id)
    expect(user).toBeNull()
})

// This test could be copied in any place we want to make sure old tokens can't be accidentally used
test('Should reject delete user for valid user with expired/nonexistent token', async () => {
    // Create a validly created token that 'exists' in the past but
    const token = jwt.sign({ id: testUser1.id, iat: Math.floor(Date.now() / 1000 - 10) }, process.env.JWT_SECRET)
    await request(app).delete('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(401)
})

test('Should reject delete user for unauthenticated user', async () => {
    await request(app).delete('/users/profile')
        .send()
        .expect(401)
})