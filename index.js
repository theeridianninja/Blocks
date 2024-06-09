const secret = "supersecretsecret"

const express = require('express')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const ejs = require('ejs')

const app = express()
app.use(express.static('assets'))
app.set('trust proxy', 1)
app.use(cookieSession({
    name: 'session',
    keys: [secret]
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}));

const normalizedPath = require("path").join(__dirname, "mods");
const mods = {}

require("fs").readdirSync(normalizedPath).forEach(async (file) => {
    mods[file.split(".js")[0]] = await require("./mods/" + file).main()
});

const port = 8443

app.post('/api/:module/:route', (req, res) => {
    let receivedToken;
    if (req.session.token) receivedToken = req.session.token
    if (req.headers.authorization) receivedToken = req.headers.authorization

    jwt.verify(receivedToken, secret, async (err, decoded) => {
        if (err) {
            console.log("Error in user validation from " + req.ip + " (This doesn't mean you are getting hacked, " +
                "the user could have just had an expired session!)")

            res.send(await ejs.renderFile('index.ejs', {authenticationValid: false}, {async:true}))
        }
        if (decoded) {
            mods[req.route.module][req.route.module](req, res)
        }
    });
})

app.get('/', (req, res) => {
    let receivedToken;
    if (req.session.token) receivedToken = req.session.token
    if (req.headers.authorization) receivedToken = req.headers.authorization

    jwt.verify(receivedToken, secret, async (err, decoded) => {
        if (err) {
            console.log("Error in user validation from " + req.ip + " (This doesn't mean you are getting hacked, " +
                "the user could have just had an expired session!)")

            res.send(await ejs.renderFile('index.ejs', {authenticationValid: false}, {async:true}))
        }
        if (decoded) {
            console.log(req.ip + " logged into the dashboard with a valid token")
            res.redirect('/dashboard/dashboard')
        }
    });
})

app.get('/dashboard/:page', (req, res) => {
    let recievedToken;
    if (req.session.token) recievedToken = req.session.token
    if (req.headers.authorization) recievedToken = req.headers.authorization

    jwt.verify(recievedToken, secret, async (err, decoded) => {
        if (err) {
            console.log("Error in user validation from " + req.ip)
            res.send(await ejs.renderFile('index.ejs', {authenticationValid: false}, {async:true}))
        }
        if (decoded) {
            console.log(req.ip + " logged into the dashboard with a valid token")
            res.send(await ejs.renderFile('index.ejs', {authenticationValid: true, page: req.params.page, mods: mods}, {async:true}))
        }
    });
})

app.post('/', async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const db = await new sqlite3.Database('data')
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
        if (err) {
            res.sendStatus(401)
            return
        }
        if (row) {
            if (row.password === password) {
                console.log(username + " logged in from " + req.ip);
                req.session.token = await jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + (60 * 15),
                    data: username
                }, secret)
                res.send(await ejs.renderFile('index.ejs', {authenticationValid: true, page: "dashboard", mods: mods}, {async:true}))
            } else {
                res.sendStatus(401)
            }
        } else {
            res.sendStatus(401)
        }
    });
});

app.listen(port)