const express = require('express')
const router = express.Router()
const Users = require('../models/auth')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const verifyToken = require('../middlewares/auth')
const Otp = require('../models/send-otp')
const sendOTP = require('../utils/sendEmail')
const { OAuth2Client } = require('google-auth-library')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)


// Register - Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body

        const user = await Users.findOne({ email })

        if (user) {
            return res.status(409).json({
                message: 'Email already registered'
            })
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString()

        await Otp.deleteMany({ email })

        const newOtp = new Otp({
            email,
            otp,
            fullName,
            password,
            role,
            expiresAt: new Date(
                Date.now() + 10 * 60 * 1000
            )
        })

        await newOtp.save()

        await sendOTP(email, otp)

        res.status(200).json({
            message: 'OTP Sent'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: error.message
        })
    }
})


// Register - Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body

        const record = await Otp.findOne({ email })

        if (!record) {
            return res.status(400).json({
                message: 'OTP expired'
            })
        }

        if (record.expiresAt < new Date()) {
            await Otp.deleteOne({ email })

            return res.status(400).json({
                message: 'OTP expired'
            })
        }

        if (record.otp !== otp) {
            return res.status(400).json({
                message: 'Invalid OTP'
            })
        }

        const hashedPassword = await bcrypt.hash(
            record.password,
            10
        )

        const uid =
            Math.random().toString(36).slice(2) +
            Math.random().toString(36).slice(2)

        await Users.create({
            uid,
            fullName: record.fullName,
            email: record.email,
            password: hashedPassword,
            role: record.role
        })

        await Otp.deleteOne({ email })

        res.status(201).json({
            message: 'Account Created Successfully'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: error.message
        })
    }
})


// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await Users.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: 'Invalid email or password'
            })
        }

        if (!user.password) {
            return res.status(400).json({
                message:
                    'This account was registered with Google. Please use Continue with Google.'
            })
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        )

        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid email or password'
            })
        }

        const token = jwt.sign(
            { uid: user.uid },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        const userObj = user.toObject
            ? user.toObject()
            : { ...user }

        delete userObj.password

        res.status(200).json({
            message: 'Login successful',
            token,
            user: userObj
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})


// Google Login
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body

        if (!credential) {
            return res.status(400).json({
                message: 'Google credential is required'
            })
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                message:
                    'Google Client ID is not configured on the server'
            })
        }

        let payload

        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            })

            payload = ticket.getPayload()

        } catch (error) {
            console.error(
                'Google token verification failed:',
                error.message
            )

            return res.status(401).json({
                message: 'Invalid or expired Google credential'
            })
        }

        if (!payload || !payload.email) {
            return res.status(400).json({
                message:
                    'Unable to retrieve email from Google account'
            })
        }

        if (!payload.email_verified) {
            return res.status(400).json({
                message:
                    'Google account email is not verified'
            })
        }

        const googleId = payload.sub
        const normalizedEmail =
            payload.email.toLowerCase().trim()

        const fullName =
            payload.name ||
            payload.email.split('@')[0]

        let user = await Users.findOne({ googleId })

        if (!user) {
            user = await Users.findOne({
                email: normalizedEmail
            })

            if (user) {
                if (!user.googleId) {
                    user.googleId = googleId
                    await user.save()
                }
            } else {
                const uid =
                    Math.random().toString(36).slice(2) +
                    Math.random().toString(36).slice(2)

                user = await Users.create({
                    uid,
                    fullName,
                    email: normalizedEmail,
                    googleId,
                    authProvider: 'google',
                    role: 'Customer'
                })
            }
        }

        const token = jwt.sign(
            { uid: user.uid },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        const userObj = user.toObject
            ? user.toObject()
            : { ...user }

        delete userObj.password

        res.status(200).json({
            message: 'Login successful',
            token,
            user: userObj
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})


// Reset Password - Send OTP
router.post('/reset-password/send-otp', async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: 'Email is required'
            })
        }

        const normalizedEmail =
            email.toLowerCase().trim()

        const user = await Users.findOne({
            email: normalizedEmail
        })

        if (!user) {
            return res.status(404).json({
                message: 'No account found with this email'
            })
        }

        if (!user.password) {
            return res.status(400).json({
                message:
                    'This account was registered with Google. Please use Google login.'
            })
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString()

        await Otp.deleteMany({
            email: normalizedEmail
        })

        const newOtp = new Otp({
            email: normalizedEmail,
            otp,
            expiresAt: new Date(
                Date.now() + 10 * 60 * 1000
            )
        })

        await newOtp.save()

        await sendOTP(normalizedEmail, otp)

        res.status(200).json({
            message: 'Password reset OTP sent successfully'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})


// Reset Password - Update
router.post('/reset-password/update', async (req, res) => {
    try {
        const {
            email,
            otp,
            password
        } = req.body

        if (!email || !otp || !password) {
            return res.status(400).json({
                message:
                    'Email, OTP and password are required'
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                message:
                    'Password must be at least 6 characters'
            })
        }

        const normalizedEmail =
            email.toLowerCase().trim()

        const record = await Otp.findOne({
            email: normalizedEmail
        })

        if (!record) {
            return res.status(400).json({
                message: 'OTP expired or not found'
            })
        }

        if (record.expiresAt < new Date()) {
            await Otp.deleteOne({
                email: normalizedEmail
            })

            return res.status(400).json({
                message: 'OTP expired'
            })
        }

        if (record.otp !== otp) {
            return res.status(400).json({
                message: 'Invalid OTP'
            })
        }

        const user = await Users.findOne({
            email: normalizedEmail
        })

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        )

        user.password = hashedPassword

        await user.save()

        await Otp.deleteOne({
            email: normalizedEmail
        })

        res.status(200).json({
            message: 'Password reset successfully'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})


// Get Current User
router.get('/user', verifyToken, async (req, res) => {
    try {
        const { uid } = req

        const user = await Users.findOne({ uid })

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        res.status(200).json({
            message: 'User found',
            user
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})


module.exports = router