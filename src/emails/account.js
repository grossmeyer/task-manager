const sgMail = require('@sendgrid/mail')
const from = process.env.DEFAULT_REPLY_FROM_EMAIL

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = async (name, email) => {
    try {
        await sgMail.send({
            to: email,
            from,
            subject: 'Welcome to Task Manager App!',
            text: `Hi ${name}, thanks for signing up to use Task Manager App!`,
        })
    } catch (error) {
        console.error(error)
        if (error.response) {
            console.error(error.response.body)
        }
    }
}

const sendDeleteProfileEmail = async (name, email) => {
    try {
        await sgMail.send({
            to: email,
            from,
            subject: 'Thanks for using Task Manager App!',
            text: `Hi ${name}, your profile has been deleted. We hope you enjoyed using Task Manager App!`,
        })
    } catch (error) {
        console.error(error)
        if (error.response) {
            console.error(error.response.body)
        }
    }
}

module.exports = {
    sendWelcomeEmail,
    sendDeleteProfileEmail,
}