const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const User = require('../src/models/user')

// Valid Create User format
const testUser1 = {
    name: 'Test User1',
    email: 'grossmeyer+testUser1@gmail.com',
    password: 'tester11',
}

// Missing Required Property 'name'
const testUser2 = {
    email: 'grossmeyer+testUser2@gmail.com',
    password: 'tester22',
}

// Missing Required Property 'email'
const testUser3 = {
    name: 'Test User3',
    password: 'tester33',
}

// Missing Required Property 'password'
const testUser4 = {
    name: 'Test User4',
    email: 'grossmeyer+testUser4@gmail.com',
}

// Use this for 2nd valid user tests
const testUser5 = {
    name: 'Test User5',
    email: 'grossmeyer+testUser5@gmail.com',
    password: 'tester55',
}

beforeAll(async () => {
    await User.deleteMany()
})

test('Should successfully create a new user', async () => {
    const { body: { user: { _id }} } = await request(app).post('/users')
        .send(testUser1)
        .expect(201)
    // Assert that db was successfully written
    const user = await User.findById(_id)
    expect(user).not.toBeNull()
    // Assert that password was not stored plaintext
    expect(user.password).not.toBe(testUser1.password)
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

test('Should successfully login an existing user', async () => {
    const { body: { user: { _id }, token } } = await request(app).post('/users/login')
        .send(testUser1)
        .expect(201)
    // Assert that db wrote new token and matches response token
    const { tokens } = await User.findById(_id)
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

test('Should successfully return profile for authenticated user', async () => {
    const { body: { token } } = await request(app).post('/users/login')
        .send(testUser1)
    await request(app).get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(200)
})

test('Should reject profile access for valid user with expired/nonexistent token', async () => {
    const { _id } = await User.findByCredentials(testUser1.email, testUser1.password)
    // Create a validly created token that shouldn't exist anywhere else but here
    const token = await jwt.sign({ id: _id.toString() }, process.env.JWT_SECRET)
    await request(app).get('/users/profile')
        .set('Authorization', 'Bearer', token)
        .send()
        .expect(401)
})

test('Should reject profile access for unauthenticated user', async () => {
    await request(app).get('/users/profile')
        .send()
        .expect(401)
})

test('Should successfully delete user for authenticated user', async () => {
    const { body: { user: { _id }, token } } = await request(app).post('/users/login')
        .send(testUser1)
    await request(app).delete('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(200)
    // Assert that db was successfully written
    const user = await User.findById(_id)
    expect(user).toBeNull()
    // Recreate testUser1 for following tests
    await request(app).post('/users')
        .send(testUser1)
})

test('Should reject delete user request for valid user with expired/nonexistent token', async () => {
    const { body: { user: { _id } } } = await request(app).post('/users/login')
        .send(testUser1)
    // Create a validly created token that shouldn't exist anywhere else but here
    const token = await jwt.sign({ id: _id.toString() }, process.env.JWT_SECRET)
    await request(app).delete('/users/profile')
        .set('Authorization', 'Bearer', token)
        .send()
        .expect(401)
})

test('Should reject delete user request for unauthenticated user', async () => {
    await request(app).delete('/users/profile')
        .send()
        .expect(401)
})