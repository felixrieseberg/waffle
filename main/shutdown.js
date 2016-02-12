"use strict";

const electron      = require('electron');
const app           = electron.app;
const ipcMain       = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;

let _shutdown = {
    prevented: false,
    requested: false
};

ipcMain.on('shutdown', function onShutdownMessage(event, arg) {
    switch (arg) {
        case 'prevent':
            prevent(event);
            break;
        case 'release':
            release(event);
            break;
        case 'shutdown':
            shutdown(event);
            break;
        default:
            break
    }

    event.returnValue = true;
});

function prevent(/* event */) {
    console.log('Preventing shutdown');
    _shutdown.prevented = true;
}

function release(/* event */) {
    console.log('Releasing shutdown');
    _shutdown.prevented = false;

    if (_shutdown.requested) {
        console.log('Shutting down');
        app.quit();
    }
}

function shutdown(event) {
    console.log('Shutdown requested...');
    if (!_shutdown.prevented) {
        console.log('...and granted');
        app.quit();
    } else {
        console.log('...and denied (for now)');
        _shutdown.requested = true;

        const win = BrowserWindow.fromWebContents(event.sender);
        win.hide();
    }
}

function isPrevented() {
    return _shutdown.prevented;
}

function isRequested() {
    return _shutdown.requested;
}

module.exports = {
    prevent,
    release,
    shutdown,
    isPrevented,
    isRequested
}
