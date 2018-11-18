let $ = require('./bower_components/jquery/dist/jquery.min.js')
var adb = require('adbkit')
var Promise = require('bluebird')
var client = adb.createClient()
var app = {
    deviceList: new Map(),
    init: (callback) => {
        client.trackDevices()
            .then(function(tracker) {
                tracker.on('add', function(device) {
                    if (!app.deviceList.has(device.id)) {
                        app.deviceList.set(device.id, device);
                        console.log('Added new device : ' + device.id);
                    } else {
                        console.lof('Already device exist: ' + device.id);
                    }
                    callback();
                })
                tracker.on('remove', function(device) {
                    deviceList.delete(device.id);
                    console.log('Device ' + device.id + ' has been removed.');
                })
                tracker.on('end', function() {
                    console.log('Tracking stopped');
                })
            })
            .catch(function(err) {
                console.error('Something went wrong:', err.stack)
            })
    },
    cleaner:{
    	junks:{
    		knownExt:['jpeg','jpg','mp3','mp4','m4a','aac','png'],
    		known:[],
    		unknown:[]
    	}
    },
    listsd: (callback) => {
        var list = [];
        app.deviceList.forEach((device) => {
            client.readdir(device.id, '/sdcard')
                .then(function(files) {
                    files.forEach(function(file) {
                        if (file.isFile()) {
                            list.push(file.name)
                            var ext = file.name.substr(file.name.lastIndexOf('.') + 1);
                            if (app.cleaner.junks.knownExt.indexOf(ext) > -1){
                            	app.cleaner.junks.known.push(file.name);
                            } else {
                            	app.cleaner.junks.unknown.push(file.name);
                            }
                        }
                    })
                }).then(()=> callback(list))
        });
    },
    listsdFolders:(callback)=>{
    	var list=[];
    	app.deviceList.forEach((device) => {
            client.readdir(device.id, '/sdcard')
                .then(function(files) {
                    files.forEach(function(file) {
                        if (!file.isFile()) {
                            list.push(file.name);
                        }
                    })
                })
                .then(()=>{
                    callback(list)
                });
        });
    },
    render:{
        folder:()=>{
            app.listsdFolders((list)=>{
                list.sort().forEach((item)=>{
                    $('#folders').append(`<tr><td>${item}</td></tr>`)
                })
            })
        }
    }
};

app.init(()=>{
    app.render.folder();
});