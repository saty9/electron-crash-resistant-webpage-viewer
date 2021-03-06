const {app, BrowserWindow} = require('electron');
const args = require('minimist')(process.argv.slice(2));

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let monitoredWindow;
let happy;
happy = true;
let target_address;
try{
    target_address = args.t;
    if (target_address.length == 0) {
        throw "bad address argument"
    }
} catch (e) {
    target_address = "http://google.co.uk"
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        fullscreen: true,
        title: "sad"
    });

    // and load the reserve-page.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/reserve-page.html');

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    create_monitored();
};

const kill_monitored_and_retry = () => {
    monitoredWindow.close();
    setTimeout(create_monitored, 60*1000);
};

const create_monitored = () => {
    monitoredWindow = new BrowserWindow({
        fullscreen: true,
        show: false,
        alwaysOnTop: true,
        title: "happy"
    });

    monitoredWindow.once('ready-to-show', () => {
        //this will run as long as the main page loads even if resources on the page have 404'd
        monitoredWindow.show();
        happy = true;
    });

    monitoredWindow.webContents.on("did-fail-load", function (event, code) {
        console.log("did-fail-load with chromium error code: " + code);
        happy = false;
        monitoredWindow.hide();
        kill_monitored_and_retry()
    });

    monitoredWindow.webContents.on('crashed', (e) => {
        console.log("crash detected restarting window");
        happy = false;
        kill_monitored_and_retry();
    });

    monitoredWindow.webContents.on('did-navigate', (e, url, code) => {
        if (code > 400){
            console.log("error " + code + " loading " + url);
            happy = false;
            kill_monitored_and_retry();
        }
    });

    monitoredWindow.loadURL(target_address);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.commandLine.appendSwitch('ignore-gpu-blacklist');

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
