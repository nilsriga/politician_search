const sqlite3 = require('sqlite3').verbose();
const request = require('request');
const crypto = require('crypto');

// Getting politician data
function getDataIntoDatabase() {
    const politiciansUrl = "https://cdn.rawgit.com/everypolitician/everypolitician-data/6e83936a571e4c050a321390930985e07c917848/data/Latvia/Saeima/ep-popolo-v1.0.json";
    let persons;
    let memberships;

    request(politiciansUrl, (err, res, body) => {
        let data = JSON.parse(body);
        persons = data.persons;
        memberships = data.memberships;
        createDatabase();
    });
    // Creating a Database, and filling it with data 
    function createDatabase() {
        let db = new sqlite3.Database('./db/politicians.db', sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Connected to the politicians database.');
            db.run(`CREATE TABLE IF NOT EXISTS politicians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        given_name TEXT,
        family_name TEXT,
        image_url TEXT,
        person_id TEXT UNIQUE
        )`,
                (err) => {
                    if (err) {
                        console.log("Table Creating " + err);
                        return
                    } else {
                        var insertPersons = 'INSERT OR IGNORE INTO politicians (given_name, family_name, image_url, person_id) VALUES (?,?,?,?)'
                        persons.forEach((person) => {
                            db.run(insertPersons, [person.given_name, person.family_name, person.image, person.id])
                        })
                    }
                });
            db.run(`CREATE TABLE IF NOT EXISTS memberships (
            id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT,
            party_name text,
            person_id text,
            start_date text,
            end_date text,
            record_hash text UNIQUE,
            FOREIGN KEY(person_id) REFERENCES politicians(person_id) 
            )`,
                (err) => {
                    if (err) {
                        console.log("Table Creating " + err);
                        return
                    } else {
                        var insertMemberships = 'INSERT OR IGNORE INTO memberships (party_name, person_id, start_date, end_date, record_hash) VALUES (?,?,?,?,?)';
                        function ifDataExists(date) {
                            if (date == undefined) {
                                return 'no information';
                            } else {
                                return date;
                            }
                        };
                        // this function is to create a unique field so that every time when node server starts and parser.js is run, the memberships table is not updated with duplicate data
                        function createHash(object) {
                            let checkedObject = ifDataExists(object);
                            let hash = crypto.createHash('md5').update(JSON.stringify(checkedObject)).digest("hex");
                            return hash;
                        }
                        memberships.forEach((membership) => {
                            function humanize(partyName) {
                                var frags = partyName.split('_');
                                for (i = 0; i < frags.length; i++) {
                                    frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
                                }
                                var removeMark = frags.join(' ').split('&#34;');
                                for (i = 0; i < removeMark.length; i++) {
                                    removeMark[i] = removeMark[i].charAt(0).toUpperCase() + removeMark[i].slice(1);
                                }
                                return removeMark.join(' ');
                            };
                            db.run(insertMemberships, [humanize(membership.on_behalf_of_id), membership.person_id, ifDataExists(membership.start_date), ifDataExists(membership.end_date), createHash(membership)])
                        })
                    }
                }
            );
        });
    };
};
module.exports = getDataIntoDatabase;