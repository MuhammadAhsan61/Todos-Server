const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS } })

const sendOTP = async (email, otp) => {

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "Sigma Store Verification Code",

        html: `
        <h2>Email Verification</h2>

        <p>Your verification code is</p>

        <h1>${otp}</h1>

        <p>This code expires in 10 minutes.</p>
        `
    })
}

module.exports = sendOTP
