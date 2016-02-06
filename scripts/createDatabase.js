"use strict";

const config = require('../knexfile.js');
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: '../butter_dev.sqlite'
    }
});

knex.migrate.latest([config]);
