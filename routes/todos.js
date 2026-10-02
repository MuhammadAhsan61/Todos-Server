const express = require('express')
const router = express.Router()

const Todo = require('../models/todos')
const verifyToken = require('../middlewares/auth')

// Add Todo
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { uid } = req
        const { title, description, priority, dueDate } = req.body

        if (!title) {
            return res.status(400).json({
                message: 'Title is required'
            })
        }


        const todo = await Todo.create({
            uid,
            title,
            description,
            priority,
            dueDate
        })

        res.status(201).json({
            message: 'Todo added successfully',
            todo
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Failed to add todo',
            error: error.message
        })
    }
})

// Get Todos
router.get('/get', verifyToken, async (req, res) => {
    try {
        const { uid } = req

        const todos = await Todo.find({ uid }).sort({ createdAt: -1 })

        res.status(200).json({
            todos
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Failed to get todos',
            error: error.message
        })
    }
})

// Edit Todo
router.put('/edit/:id', verifyToken, async (req, res) => {
    try {
        const { uid } = req
        const { title, description, status, priority, dueDate } = req.body

        const todo = await Todo.findOneAndUpdate(
            {
                _id: req.params.id,
                uid
            },
            {
                title,
                description,
                status,
                priority,
                dueDate
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!todo) {
            return res.status(404).json({
                message: 'Todo not found'
            })
        }

        res.status(200).json({
            message: 'Todo updated successfully',
            todo
        })
    } catch (error) {
        res.status(500).json({
            message: 'Failed to update todo',
            error: error.message
        })
    }
})

// Delete Todo
router.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
        const {uid} = req
        const todo = await Todo.findOneAndDelete({
            _id: req.params.id,
            uid
        })

        if (!todo) {
            return res.status(404).json({
                message: 'Todo not found'
            })
        }

        res.status(200).json({
            message: 'Todo deleted successfully'
        })
    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete todo',
            error: error.message
        })
    }
})

module.exports = router