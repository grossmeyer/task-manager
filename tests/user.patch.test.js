const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { populateDatabase, testUser1 } = require('./fixtures/db')

// Use this for 2nd valid user tests
const testUser5 = {
    name: 'Test User5',
    email: 'grossmeyer+testuser5@gmail.com',
    password: 'tester55',
    age: 5,
}

// Non-allowed properties
const testUser6 = {
    homeCity: 'Boston',
    homeState: 'Massachusetts'
}

// Initialize testUser1 before each test for easy db lookups
beforeEach(populateDatabase)

/* 
PATCH request tests
*/

test('Should update profile data for authenticated user', async () => {
    await request(app).patch('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testUser5)
        .expect(200)
    // Assert that data was written to db
    const { name, email, age } = await User.findById(testUser1.id)
    expect(name).toBe(testUser5.name)
    expect(email).toBe(testUser5.email)
    expect(age).toBe(testUser5.age)
})

test('Should fail update profile for authenticated user when provided non-allowed properties', async () => {
    await request(app).patch('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testUser6)
        .expect(400)
    // Assert that data was not written to db
    const { homeCity, homeState } = await User.findById(testUser1.id)
    expect(homeCity).toBeUndefined()
    expect(homeState).toBeUndefined()
})

test('Should fail to update profile data for unauthenticated user', async () => {
    await request(app).patch('/users/profile')
        .send()
        .expect(401)
})