const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { populateDatabase, testUser1 } = require('./fixtures/db')

// Missing Required Property 'name'
const testUser2 = {
    name: '',
    email: 'grossmeyer+testuser2@gmail.com',
    password: 'tester22',
}

// Missing Required Property 'email'
const testUser3 = {
    name: 'Test User3',
    password: 'tester33',
    email: '',
}

// Missing Required Property 'password'
const testUser4 = {
    name: 'Test User4',
    password: '',
    email: 'grossmeyer+testuser4@gmail.com',
}

// Use this for 2nd valid user tests
const testUser5 = {
    name: 'Test User5',
    email: 'grossmeyer+testuser5@gmail.com',
    password: 'tester55',
    age: 5,
}

// Invalid password length
const testUser6 = {
    name: 'Test User6',
    email: 'grossmeyer+testuser6@gmail.com',
    password: 'tester6',
    age: 6,
}

// Password contains 'password'
const testUser7 = {
    name: 'Test User7',
    email: 'grossmeyer+testuser7@gmail.com',
    password: 'password77',
    age: 7,
}

// Initialize testUser1 before each test for easy db lookups
beforeEach(populateDatabase)

/* 
POST request tests
*/

test('Should successfully create a new user', async () => {
    const { body: { user: { _id } } } = await request(app).post('/users')
        .send(testUser5)
        .expect(201)
    // Assert that user was successfully written to db
    const user = await User.findById(_id)
    expect(user).not.toBeNull()
    // Assert that password was not stored plaintext
    expect(user.password).not.toBe(testUser5.password)
})

test('Should reject creating user without name', async () => {
    await request(app).post('/users')
        .send(testUser2)
        .expect(400)
})

test('Should reject creating user without email', async () => {
    await request(app).post('/users')
        .send(testUser3)
        .expect(400)
})

test('Should reject creating user without password', async () => {
    await request(app).post('/users')
        .send(testUser4)
        .expect(400)
})

test('Should reject creating user without password too short', async () => {
    await request(app).post('/users')
        .send(testUser6)
        .expect(400)
})

test('Should reject creating user with password containing "password"', async () => {
    await request(app).post('/users')
        .send(testUser7)
        .expect(400)
})

test('Should successfully login an existing user', async () => {
    const { body: { token } } = await request(app).post('/users/login')
        .send(testUser1)
        .expect(201)
    // Assert that response token matches token written to db
    const { tokens } = await User.findById(testUser1.id)
    expect(tokens[1].token).toBe(token)
})

test('Should reject login for bad username', async () => {
    await request(app).post('/users/login')
        .send(testUser3)
        .expect(400)
})

test('Should reject login for bad password', async () => {
    await request(app).post('/users/login')
        .send(testUser3)
        .expect(400)
})

test('Should reject login for bad data', async () => {
    await request(app).post('/users/login')
        .send(testUser4)
        .expect(400)
})

test('Should successfully logout current authenticated user token', async () => {
    await request(app).post('/users/logout')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .send()
        .expect(200)
    // Assert that token has been removed from db
    const { tokens: currentTokens } = await User.findById(testUser1.id)
    expect(currentTokens.length).toBe(0)
})

test('Should reject logout for unauthenticated user', async () => {
    await request(app).post('/users/logout')
        .send()
        .expect(401)
})

test('Should successfully logoutAll current authenticated user tokens', async () => {
    const { body: { token } } = await request(app).post('/users/login')
        .send(testUser1)
    await request(app).post('/users/logoutAll')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(200)
    // Assert that tokens have been removed from db
    const { tokens: currentTokens } = await User.findById(testUser1.id)
    expect(currentTokens.length).toBe(0)
})

test('Should reject logoutAll for unauthenticated user', async () => {
    await request(app).post('/users/logoutAll')
        .send()
        .expect(401)
})

test('Should upload profile-pic for authenticated user', async () => {
    await request(app).post('/users/profile-pic')
        .set('Authorization', await User.getBearerToken(testUser1.id))
        .attach('profile-pic', 'tests/fixtures/profile-pic.jpg')
        .expect(200)
    // Assert that binary data was written to db
    const { profile_pic } = await User.findById(testUser1.id)
    expect(profile_pic).toEqual(expect.any(Buffer))
})

test('Should fail to upload profile-pic for unauthenticated user', async () => {
    await request(app).post('/users/profile-pic')
        .send()
        .expect(401)
})