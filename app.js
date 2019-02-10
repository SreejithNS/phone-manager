const {app, BrowserWindow} = require('electron')
const url = require('url')
const path = require('path')

let win

function createWindow() {
   win = new BrowserWindow({
   width: 1000,
    height: 600,
    webPreferences: {
    nodeIntegrationInWorker: true
    },
    frame:false,
    show: false,
    transparent:true,
    resizable:false,
    hasShadow:true
})
   win.loadURL(url.format ({
      pathname: path.join(__dirname, '/render/index.html'),
      protocol: 'file:',
      slashes: true
   }))
    win.once('ready-to-show', () => {
     win.show()
 	})
}

app.on('ready', createWindow)
app.on('window-all-closed', () => {
  app.quit()
})