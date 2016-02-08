"use strict";

const app = require('electron').app;
const path = require('path');
const fs = require('fs-extra');
const appPath = app.getPath('userData');
const templatePath = path.join(__dirname, '..', 'database', 'waffle_empty.sqlite');
const proDbPath = path.join(appPath, 'waffle.sqlite');
const devDbPath = path.join(appPath, 'waffle_dev.sqlite');

module.exports = {
    ensureDatabase() {
        return new Promise((resolve, reject) => {
            let dbPath = (process.env.debug) ? devDbPath : proDbPath;
            fs.stat(dbPath, (err, stat) => {
                if (!err) {
                    console.log(`SQLite database exists in ${dbPath}`);
                    resolve();
                } else {
                    console.log(`SQLite database not found, creating in ${dbPath}`);
                    fs.copy(templatePath, dbPath, (err) => {
                        if (err) {
                            console.log(err);
                            reject(new Error('Could not create database'));
                        } else {
                            console.log(`SQLite database created in ${dbPath}`);
                            resolve();
                        }
                    });
                }
            });
        });
    }
}
