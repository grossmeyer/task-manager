const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const User = require('../src/models/user')

// Valid Create User format
const testUser1 = {
    name: 'Test User1',
    email: 'grossmeyer+testUser1@gmail.com',
    password: 'tester11',
    id: '',
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

beforeEach(async () => {
    await User.deleteMany()
    const { body: { user: { _id } } } = await request(app).post('/users')
        .send(testUser1)
    return testUser1.id = _id
})

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

test('Should successfully login an existing user', async () => {
    const { body: { token} } = await request(app).post('/users/login')
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

test('Should successfully return profile for authenticated user', async () => {
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    console.log('Retrieved token is', token)
    await request(app).get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(200)
})

test('Should reject profile access for valid user with expired/nonexistent token', async () => {
    // Create a validly created token that shouldn't exist anywhere else but here
    const token = jwt.sign({ id: testUser1.id, iat: Math.floor(Date.now() / 1000 + 1) }, process.env.JWT_SECRET)
    console.log('Current token', token)
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

test('Should upload avatar image', async () => {
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    await request(app).post('/users/profile-pic')
        .set('Authorization', `Bearer ${token}`)
        .attach('profile-pic', 'tests/fixtures/profile-pic.jpg')
        .expect(200)
    // Assert that binary data was written to db
    const { profile_pic } = await User.findById(testUser1.id)
    expect(profile_pic).toEqual(expect.any(Buffer))
})

test('Should successfully delete user for authenticated user', async () => {
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    await request(app).delete('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(200)
    // Assert that user was deleted from db
    const user = await User.findById(testUser1.id)
    expect(user).toBeNull()
})

test('Should reject delete user request for valid user with expired/nonexistent token', async () => {
    // Create a validly created token that shouldn't exist anywhere else but here
    const token = jwt.sign({ id: testUser1.id, iat: Math.floor(Date.now() / 1000 + 1) }, process.env.JWT_SECRET)
    await request(app).delete('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(401)
})

test('Should reject delete user request for unauthenticated user', async () => {
    await request(app).delete('/users/profile')
        .send()
        .expect(401)
})