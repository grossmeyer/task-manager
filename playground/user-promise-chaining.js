require('../src/db/mongoose')
const User = require('../src/models/user')

const id = '5f7b2d68258f6d4a8c2a0c54'
const age = 34

// User.findByIdAndUpdate(_id, { age: 1 }).then(user => {
//     console.log(user)
//     return User.countDocuments({ age: 1 })
// }).then(count => {
//     console.log(count)
// }).catch(error => {
//     console.log(error)
// })

const updateAgeAndCount = async (id, age) => {
    const user = await User.findByIdAndUpdate(id, { age })
    const count = await User.countDocuments({ age })
    return {user, count}
}

updateAgeAndCount(id, age).then( ({user, count})  => {
    console.log('Modified age of', user.name)
    console.log('Number of users with age', age, ':', count)
}).catch(error => {
    console.log(error)
})