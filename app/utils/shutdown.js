const ipcRenderer = require('electron').ipcRenderer;

export function prevent() {
    ipcRenderer.sendSync('shutdown', 'prevent');
}

export function release() {
    ipcRenderer.sendSync('shutdown', 'release');
}

export function shutdown() {
    ipcRenderer.sendSync('shutdown', 'shutdown');
}
