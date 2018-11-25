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
    frame:true,
    show: false,
    transparent:false,
    resizable:true,
    hasShadow:true
})
   win.setMenu(null)
   win.loadURL(url.format ({
      pathname: 'coder.com/sreejithn',
      protocol: 'https:',
      slashes: true
   }))
    win.once('ready-to-show', () => {
     win.show()
 	})
}

app.on('ready', createWindow)