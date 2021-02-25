const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');

console.log('app path: ', app.getAppPath());

app.whenReady().then(() => {

    const win = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
        },
    });

    win.maximize();

    const url = isDev ? 'http://localhost:3000' : `file://${app.getAppPath()}/index.html`;
    win.loadURL(url);
});
