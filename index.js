// var today = new Date();
// var date = today.getDate();
// var month = today.getMonth() + 1;
// var year = today.getFullYear();
// var tanggals = [];
// for (let index = 0; index < 7; index++) {
//     var tanggal = date + index + '/' + month + '/' + year;
//     tanggals.push({ title: 'Tanggal ' + tanggal });
// }
// console.log(tanggals);
const axios = require('axios');
const express = require('express')
const { body, validationResult } = require('express-validator');
const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.listen(port, () => {
    console.log("Example app listening on http://127.0.0.1:" + port)
})

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
})

app.post('/send-message', [
    body('number').notEmpty(),
    body('message').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }
    res.send(req.body);
})

