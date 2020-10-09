require('../src/db/mongoose')
const { findByIdAndDelete, countDocuments } = require('../src/models/task')
const Task = require('../src/models/task')

const id = '5f7c89ee94485747bc3dc03f'

// Task.findByIdAndDelete(_id).then(task => {
//     console.log(task)
//     return Task.countDocuments({ completed: false })
// }).then(count => {
//     console.log(count)
// }).catch(error => {
//     console.log(error)
// })

const deleteTaskAndCount = async id => {
    const task = await Task.findByIdAndDelete(id)
    const count = await Task.countDocuments({ completed: false })
    return { task, count }
}

deleteTaskAndCount(id).then(({ task, count }) => {
    console.log('Deleted task:', task.description)
    console.log('Number of remaining tasks incomplete:', count)
}).catch(error => {
    console.log(error)
})