const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const User = require('../src/models/user')

// Valid Create User format
const testUser1 = {
    name: 'Test User1',
    email: 'grossmeyer+testuser1@gmail.com',
    password: 'tester11',
    id: '',
    tokens: [],
}

// Missing Required Property 'name'
const testUser2 = {
    email: 'grossmeyer+testuser2@gmail.com',
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
    email: 'grossmeyer+testuser4@gmail.com',
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

// Initialize testUser1 before each test for easy db lookups
beforeEach(async () => {
    await User.deleteMany()
    const { body: { user: { _id } } } = await request(app).post('/users')
        .send(testUser1)
    testUser1.id = _id
})

// // Cleanup
// afterAll(async () => {
//     await User.deleteMany()
// })

/* 
GET request tests
*/

test('Should successfully return profile for authenticated user', async () => {
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    await request(app).get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
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
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    await request(app).post('/users/profile-pic')
        .set('Authorization', `Bearer ${token}`)
        .attach('profile-pic', 'tests/fixtures/profile-pic.jpg')
    await request(app).get(`/users/${testUser1.id}/profile-pic`)
        .expect(200)
})

test('Should reject profile-pic request if doesn\'t exist', async () => {
    await request(app).get(`/users/${testUser1.id}/profile-pic`)
        .expect(404)
})

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
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    await request(app).post('/users/logout')
        .set('Authorization', `Bearer ${token}`)
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

test('Should fail to upload profile-pic for unauthenticated user', async () => {
    await request(app).post('/users/profile-pic')
        .send()
        .expect(401)
})

/* 
PATCH request tests
*/

test('Should update profile data for authenticated user', async () => {
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    await request(app).patch('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(testUser5)
        .expect(200)
    // Assert that data was written to db
    const { name, email, age } = await User.findById(testUser1.id)
    expect(name).toBe(testUser5.name)
    expect(email).toBe(testUser5.email)
    expect(age).toBe(testUser5.age)
})

test('Should fail update profile for authenticated user when provided non-allowed properties', async () => {
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    await request(app).patch('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(testUser6)
        .expect(400)
    // Assert that data was written to db
    const { homeCity, homeState } = await User.findById(testUser1.id)
    expect(homeCity).toBeUndefined()
    expect(homeState).toBeUndefined()
})

test('Should fail to update profile data for unauthenticated user', async () => {
    await request(app).patch('/users/profile')
        .send()
        .expect(401)
})

/* 
DELETE request tests
*/

test('Should successfully delete profile-pic for authenticated user', async () => {
    const { tokens } = await User.findById(testUser1.id)
    const token = tokens[0].token
    await request(app).delete('/users/profile-pic')
        .set('Authorization', `Bearer ${token}`)
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