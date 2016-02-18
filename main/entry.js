"use strict";

const electron = require('electron');
const path = require('path');
const db = require('./database');
const shutdown = require('./shutdown');
const waffle = require('./waffle');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow = null;

app.on('window-all-closed', function onWindowAllClosed() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', function (e) {
    if (shutdown.isPrevented()) {
        e.preventDefault();
        return false;
    }
});

app.on('ready', function onReady() {
    process.env.debug = true;

    db.ensureDatabase().then(() => {
        mainWindow = new BrowserWindow({
            width: 1000,
            height: 600,
            minHeight: 400,
            minWidth: 900,
            title: 'Waffle Calendar',
            titleBarStyle: 'hidden'
        });

        // Display a cute lil' waffle in the
        // terminal window.
        waffle();

        delete mainWindow.module;

        mainWindow.loadURL(path.join('file://', __dirname, '..', 'dist', 'index.html'));
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    })
});
