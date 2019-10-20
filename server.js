// dependancies
const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const request = require('request');
const sqlite3 = require('sqlite3').verbose();
var getDataIntoDatabase = require('./parser.js');
app.use(require('express-edge'));
app.use(bodyParser.urlencoded({ extended: true }));

// Get data and create db
getDataIntoDatabase();

// Set templating views
app.use(express.static('public'));
app.set('views', `${__dirname}/views`);

// connect to database
let db = new sqlite3.Database('./db/politicians.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the politicians database.');
});

// routes
app.get('/', (req, res) => {
    res.render("list");
});

app.get("/politicians/:offset", (req, res, next) => {
    // var sql = "SELECT * FROM politicians LIMIT 20 OFFSET ?;"
    // var sql = "SELECT DISTINCT given_name, family_name, image_url, party_name, start_date, end_date, person_id FROM politicians JOIN memberships ON memberships.person_id = politicians.person_id ORDER BY end_date ASC LIMIT 20 OFFSET ?;"
    var sql = "SELECT DISTINCT given_name, family_name, image_url, politicians.person_id FROM politicians JOIN memberships ON memberships.person_id = politicians.person_id ORDER BY end_date ASC LIMIT 20 OFFSET ?;"
    var params = [req.params.offset];
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.send({ politicians: rows });
    });
});

app.get("/politicians/memberships/:person_id", (req, res, next) => {
    // var sql = "SELECT * FROM politicians LIMIT 20 OFFSET ?;"
    // var sql = "SELECT DISTINCT given_name, family_name, image_url, party_name, start_date, end_date, person_id FROM politicians JOIN memberships ON memberships.person_id = politicians.person_id ORDER BY end_date ASC LIMIT 20 OFFSET ?;"
    var sql = "SELECT party_name, start_date, end_date FROM politicians JOIN memberships ON memberships.person_id = politicians.person_id WHERE politicians.person_id = ?;"
    var params = [req.params.person_id];
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.send({ politicians: rows });
    });
});

app.get("/politiciansCount", (req, res, next) => {
    var sql = "SELECT Count(*) FROM politicians;"
    var params = [req.params.offset]
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.send({ politicians: rows });
    });
});

app.get("/politicians/search/:name_or_last_name", (req, res, next) => {
    var sql = "SELECT DISTINCT given_name, family_name, image_url, politicians.person_id FROM politicians JOIN memberships ON memberships.person_id = politicians.person_id WHERE given_name = ? OR family_name = ? LIMIT 20;"
    var params = [req.params.name_or_last_name, req.params.name_or_last_name]
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.send({ politicians: rows });
    });
});

// server
app.listen(3000, function () {
    console.log('Listening on port 3000!')
})