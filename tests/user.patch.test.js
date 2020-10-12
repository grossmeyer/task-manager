const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { populateDatabase, testUser1 } = require('./fixtures/db')

// Missing Required Property 'name'
const testUser2 = {
    name: '',
}

// Missing Required Property 'email'
const testUser3 = {
    email: '',
}

// Missing Required Property 'password'
const testUser4 = {
    password: '',
}

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

// Invalid password length
const testUser7 = {
    name: 'Test User7',
    email: 'grossmeyer+testuser7@gmail.com',
    password: 'tester7',
    age: 7,
}

// Password contains 'password'
const testUser8 = {
    name: 'Test User8',
    email: 'grossmeyer+testuser8@gmail.com',
    password: 'password88',
    age: 8,
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

test('Should reject updating user without name', async () => {
    await request(app).patch('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testUser2)
        .expect(400)
})

test('Should reject updating user without email', async () => {
    await request(app).patch('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testUser3)
        .expect(400)
})

test('Should reject updating user without password', async () => {
    await request(app).patch('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testUser4)
        .expect(400)
})

test('Should reject updating user without password too short', async () => {
    await request(app).patch('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testUser7)
        .expect(400)
})

test('Should reject updating user with password containing "password"', async () => {
    await request(app).patch('/users/profile')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send(testUser8)
        .expect(400)
})