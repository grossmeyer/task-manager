module.exports = {
    setApiKey() {
        console.log('SendGrid API Key has been set for Jest testing environment.')
    },
    send() {
        console.log('Jest successfully simulated an email being sent using mocks.')
    }
}