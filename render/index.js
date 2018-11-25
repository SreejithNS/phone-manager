var adb = require('adbkit')
var $ = require('jquery')
var Promise = require('bluebird');
var client = adb.createClient()
var path = require('path');
require('jquery-circle-progress');
var app = {
    deviceList: new Map(),
    init: (callback) => {
        client.trackDevices()
            .then(function(tracker) {
                tracker.on('add', function(device) {
                    if (!app.deviceList.has(device.id)) {
                        app.deviceList.set(device.id, device);
                        console.log('Added new device : ' + device.id);
                        app.openFolder('/sdcard')
                    } else {
                        console.log('Already device exist: ' + device.id);
                    }
                    callback();
                })
                tracker.on('remove', function(device) {
                    app.deviceList.delete(device.id);
                    console.log('Device ' + device.id + ' has been removed.');
                })
                tracker.on('end', function() {
                    console.log('Tracking stopped');
                })
            })
            .catch(function(err) {
                console.error('Something went wrong:', err.stack)
            })
            document.addEventListener('dragover', function (event) {
              event.preventDefault();
              return false;
            }, false);

            document.addEventListener('drop', function (event) {
              event.preventDefault();
              return false;
            }, false);
    },
    cleaner:{
    	junks:{
    		knownExt:['jpeg','jpg','mp3','mp4','m4a','aac','png'],
    		known:[],
    		unknown:[]
    	},
        clean:()=>{
            app.cleaner.junks.known.forEach((file)=>{
                var ext = file.substr(file.lastIndexOf('.') + 1);
                switch(true){
                    case (ext=="mp3" || ext=="m4a"):
                    client.shell(app.deviceList.keys().next().value, `mv "/sdcard/${file}" /sdcard/mp3`)
                    console.log(`Cleaned :${file}`)
                    break;
                    case (ext=="png" || ext=="jpeg" || ext=="jpg"):
                    client.shell(app.deviceList.keys().next().value, `mv "/sdcard/${file}" /sdcard/DCIM/Pictures`)
                    console.log(`Cleaned :${file}`)
                    break;
                }
            })
        }

    },
    openFolder: (name,callback) => {
        var list = [];
        app.deviceList.forEach((device) => {
            client.readdir(device.id, name)
                .then(function(files) {
                    files.forEach(function(file) {
                        list.push(file.name)
                        if(name == "/sdcard"){
                            if (file.isFile()) {
                                console.log(file.name);
                                var ext = file.name.substr(file.name.lastIndexOf('.') + 1);
                                if (app.cleaner.junks.knownExt.indexOf(ext) > -1){
                                	app.cleaner.junks.known.push(file.name);
                                } else {
                                	app.cleaner.junks.unknown.push(file.name);
                                }
                            }
                        } 
                    })
                }).then(()=> {if(callback) callback(list)})
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
    shell:(command)=>{
        return client.shell(app.deviceList.keys().next().value, command)
        .then(adb.util.readAll)
        .then(function(output) {
          console.log('%s',  output.toString().trim())
        })
        .catch((e)=>console.log(command + '\n => Error:' +e))
    },
    render:{
        currentFolder:'/sdcard',
        folder:(name)=>{
            $('#folders').children().remove();
            app.render.currentFolder = (app.render.currentFolder==name)?app.render.currentFolder:name;
            app.openFolder(name,(list)=>{
            console.log(list)
                list.sort().forEach((item)=>{
                    var ext = (item.indexOf(".") > -1 && item.indexOf(".") !== 0)? item.substr(item.lastIndexOf('.') + 1):'Folder';
                    if(app.render.currentFolder == '/sdcard'){
                        switch(item){
                            case "DCIM":
                            $('.container').prepend(`
                                <div class="card" onclick="app.render.folder(app.render.currentFolder+'/${item}')" style="display:inline-block">
                                  <div class="card-body">
                                    <h5 class="card-title"><i class="material-icons">image</i>DCIM</h5>
                                    <h6 class="card-subtitle mb-2 text-muted">Pictures</h6>
                                    <p class="card-text">Contains all pictures.</p>
                                  </div>
                                </div>
                                `)
                            break;
                            default:
                            break;
                        }   
                    }else{
                        $('#folders').append(`<tr><td onclick="app.render.folder(app.render.currentFolder+'/${item}')">${item}</td><td>${ext}</td></tr>`)
                    }
                })
            })
        },
        recieveDrop:(e)=>{
            e.preventDefault();
            var files = e.originalEvent.dataTransfer.files;
            var thread = new Worker('uploader.js');
            $('#circle').circleProgress({startAngle: -Math.PI / 2,value: 0,lineCap: 'round',fill: {color: '#ffa500'}});
            for (let f of files) {
                thread.postMessage(f.path);
                thread.onmessage = (e)=>{
                    if(typeof e.data == "string"){
                        $('#circle').circleProgress('value',1)
                        .on('circle-animation-progress', function(event, progress, stepValue) {
                        $(this).find('strong').text(Math.round(100));
                        });
                    }else{
                    $('#circle').circleProgress('value',e.data*0.01)
                    .on('circle-animation-progress', function(event, progress, stepValue) {
                        $(this).find('strong').text(Math.round(e.data));
                    });
                }   
                }
            }
            return false;
        }
    }
};

app.init(()=>{
    //app.render.folder('/sdcard');
    console.log('app.init()')
    $('#video').on('drop',(e)=>{app.render.recieveDrop(e)});
    $('#video').on('dragover',(e)=>$(e.target).addClass('hvr-underline-from-center'));
    $('#video').on('dragleave dragend',(e)=>{$(e.target).removeClass('hvr-underline-from-center');console.log("over")});
});