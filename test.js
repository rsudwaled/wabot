const { Client, Location, List, Buttons, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    restartOnAuthFail: true,
    puppeteer: { headless: false }
});

client.initialize();

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);
    if (msg.isStatus == false) {
        // dasar reply message
        await msg.reply('test');
    }
});