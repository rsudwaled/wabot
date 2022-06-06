// init wa web js
const { Client, Location, MessageMedia, List, Buttons, LocalAuth } = require('whatsapp-web.js');
// init api
const axios = require('axios');
const express = require('express')
const { body, validationResult } = require('express-validator');
const app = express()
const port = 3000
// init helpers
const { phoneNumberFormatter } = require('./helpers/formatter');
const { response } = require('express');


// wa web js
const client = new Client({
    authStrategy: new LocalAuth(),
    restartOnAuthFail: true,
    puppeteer: {
        headless: false
    }
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
        if (msg.body == 'ping') {
            await msg.reply('pong');
        }
        //1 daftar pasien bales pilih tanggal
        else if (msg.body == 'DAFTAR PASIEN') {
            var today = new Date();
            var date = today.getDate();
            var month = today.getMonth() + 1;
            var year = today.getFullYear();
            var tanggals = [];
            for (let index = 0; index < 7; index++) {
                var tanggal = date + index + '/' + month + '/' + year;
                tanggals.push({ title: 'TANGGAL ' + tanggal });
            }

            let sections = [{ title: 'Pilih Tanggal Antrian', rows: tanggals }];
            let list = new List("Untuk pendaftaran antrian pasien silahkan pilih tanggal pendaftaran berikut.", 'Pilih Tanggal Pendaftaran', sections, '', '');
            await client.sendMessage(msg.from, list);
        }
        //2 tanggal pasien bales pilih jadwal dokter
        else if (msg.body.startsWith('TANGGAL')) {
            var tanggal = msg.body.split(' ')[1];
            var jadwals = [];
            var tanggals = tanggal.split('/');
            var hari = tanggals[0];
            var bulan = tanggals[1];
            var tahun = tanggals[2];

            var url = "http://127.0.0.1:8000/api/antrian/ref/jadwal?tanggalperiksa=" + tahun + "-" + bulan + "-" + hari;

            axios.get(url)
                .then(response => {
                    console.log(`statusCode: ${response.status}`);
                    response.data.forEach(function (jadwal) {
                        jadwals.push({ title: "JADWAL" + jadwal.id + " " + tanggal + " ", description: "Poliklinik " + jadwal.namasubspesialis + " " + jadwal.namadokter + " " + jadwal.jadwal + " " });
                    });
                    let sections = [{ title: 'Pilih Jadwal Dokter', rows: jadwals }];
                    let list = new List("Silahkan pilih jadwal dokter pada tanggal " + tanggal, 'Pilih Jadwal Dokter', sections, '', '');
                    client.sendMessage(msg.from, list);
                })
                .catch(error => {
                    console.error("Error : " + error);
                });
        }
        //3 jadwal dokter bales format pendaftaran
        else if (msg.body.startsWith('JADWAL')) {
            var pesan = msg.body.split(' ');
            var jadwal = pesan[1];
            var tanggal = pesan[2];
            let sections = [{ title: 'Pilih Format Pendaftaran', rows: [{ title: 'PASIEN JKN ', description: "DAFTAR#" + tanggal + "#" + jadwal + "#JKN#NIK#NAMA" }, { title: 'PASIEN NON JKN / UMUM ', description: "DAFTAR#" + tanggal + "#" + jadwal + "#UMUM#NIK#NAMA" },] }];
            let list = new List("Silahkan pilih format pendaftaran antrian pasien berdasarkan tipenya.", 'Pilih Format Pendaftaran', sections, '', '');
            await client.sendMessage(msg.from, list);
        }
        //4 melengkapi format pasien jkn
        else if (msg.body.startsWith('PASIEN JKN')) {
            var pesan = msg.body.split('\n')[1];
            console.log(pesan);
            await msg.reply('Silahkan kirim ulang format dibawah ini dengan mengisi nama dan nik pasien yang akan didaftarkan\n\nContoh *DAFTAR#12/12/2022#102030#JKN#1234123412341234#AHMAD*');
            client.sendMessage(msg.from, pesan);
        }
        //4 melengkapi format pasien non jkn
        else if (msg.body.startsWith('PASIEN NON JKN / UMUM')) {
            var pesan = msg.body.split('\n')[1];
            console.log(pesan);
            await msg.reply('Silahkan kirim ulang format dibawah ini dengan mengisi nama dan nik pasien yang akan didaftarkan\n\nContoh *DAFTAR#12/12/2022#102030#UMUM#1234123412341234#AHMAD*');
            client.sendMessage(msg.from, pesan);
        }
        //5 format pendaftaran dimasukan ke database
        else if (msg.body.startsWith('DAFTAR#')) {
            let pesan = msg.body.split('#');
            let tanggal = pesan[1];
            let nomor = pesan[2];
            let jenis = pesan[3];
            let nama = pesan[4];
            let nik = pesan[5];
            await msg.reply('Nomor antrian anda berhasil didaftakan dengan nomor ' + nomor + ' pada tanggal ' + tanggal + ' dengan jenis pasien ' + jenis + ' dan nama pasien ' + nama + ' dan nik pasien ' + nik);
        }
        //send button
        else if (msg.body == 'btn') {
            let button = new Buttons('Button body', [{ body: 'Button' }], 'title', 'footer');
            await client.sendMessage(msg.from, button)
        }
        // default
        else {
            let sections = [{ title: 'MENU PERINTAH', rows: [{ title: 'DAFTAR PASIEN' }, { title: 'INFO PENDAFTARAN' }, { title: 'INFO JADWAL DOKTER' }, { title: 'INFO ANTRIAN' },] }];
            let list = new List("Maaf, pesan yang anda kirimkan tidak dapat kami proses. Layanan ini diatur melalui sistem.\nUntuk pertanyaan & pengaduan silahkan hubungi *Humas RSUD Waled 08983311118* \n\nSilahkan pilih dan kirim perintah dengan klik tombol dibawah ini.", 'Pilih Menu Perintah', sections, '', '');
            await client.sendMessage(msg.from, list);
            // await client.sendMessage("6289529909036@c.us", "pesan");
        }

    }
});

// api
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.listen(port, () => {
    console.log("Example app listening on http://127.0.0.1:" + port)
});
app.get('/', (req, res) => {
    axios
        .get('https://dog.ceo/api/breeds/image/random')
        .then(res => {
            console.log(res.data);
        })
        .catch(error => {
            console.error("Error : " + error);
        });
    return res.send(res.data);
});
// send message
app.post('/send-message', [
    body('number').notEmpty(),
    body('message').notEmpty(),
], async (req, res) => {
    // checking error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }
    // init client
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;
    // send message
    client.sendMessage(number, message)
        .then(
            (response) => {
                return res.send(response);
            }
        ).catch(
            (error) => {
                return res.send("Error : " + error);
            }
        );
});
// send list button
app.post('/send-list', [
    body('number').notEmpty(),
    body('message').notEmpty(),
], async (req, res) => {
    // checking error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }
    // init client
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;
    // send list
    let sections = [{ title: 'MENU PERINTAH', rows: [{ title: 'DAFTAR PASIEN' }, { title: 'INFO PENDAFTARAN' }, { title: 'INFO JADWAL DOKTER' }, { title: 'INFO ANTRIAN' },] }];
    let list = new List("Maaf, pesan yang anda kirimkan tidak dapat kami proses. Layanan ini diatur melalui sistem.\nUntuk pertanyaan & pengaduan silahkan hubungi *Humas RSUD Waled 08983311118* \n\nSilahkan pilih dan kirim perintah dengan klik tombol dibawah ini.", 'Pilih Menu Perintah', sections, '', '');
    await client.sendMessage(number, list)
        .then(
            (response) => {
                console.log(response);
                return res.send(response);
            }
        ).catch(
            (error) => {
                console.log("Error : " + error);
                return res.send("Error : " + error);
            }
        );
});
// send media
app.post('/send-media', [
    body('number').notEmpty(),
    body('caption').notEmpty(),
    body('file').notEmpty(),
], async (req, res) => {
    // checking error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }
    // init client
    const caption = req.body.caption;
    const fileUrl = req.body.file;
    const number = phoneNumberFormatter(req.body.number);
    // init media
    let mimetype;
    const attachment = await axios.get(fileUrl, {
        responseType: 'arraybuffer'
    }).then(response => {
        mimetype = response.headers['content-type'];
        return response.data.toString('base64');
    });
    const media = new MessageMedia(mimetype, attachment, 'Media');
    // send message media
    client.sendMessage(number, media, { caption: caption })
        .then(
            (response) => {
                return res.send(response);
            }
        ).catch(
            (error) => {
                return res.send("Error : " + error);
            }
        );
});