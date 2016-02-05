/* jshint node: true */

const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let windows = [];
let mainWindow = null;

electron.crashReporter.start();

app.on('window-all-closed', function onWindowAllClosed() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', function onReady() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    delete mainWindow.module;

    mainWindow.loadURL('file://' + __dirname + '/dist/index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
        extraWindows = [];
    });
});
