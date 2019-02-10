var adb = require('adbkit')
var Promise = require('bluebird');
var client = adb.createClient()
var path = require('path');


var app = {
    status:0,
    device: {},
    watchman:()=>{
        client.trackDevices()
            .then(function(tracker) {
                tracker.on('add', function(device) {
                    if(!app.device.wait){
                        app.device.id = device.id;
                        app.openFolder('/sdcard')
                        callback();
                    }
                })
                tracker.on('remove', function(device) {
                    if(!app.device.wait){
                    console.log('Device ' + device.id + ' has been removed.');
                    if(app.device.type !== "wifi") device.id = Error('No devices online');
                    }
                })
                tracker.on('end', function() {
                    console.log('Tracking stopped');
                })
            })
            .catch(function(err) {
                console.error('Something went wrong:', err.stack)
            })
    },
    init: (callback) => {
            app.watchman();
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
    		knownExt:['jpeg','jpg','mp3','mp4','m4a','aac','png','wav'],
    		known:[],
    		unknown:[]
    	},
        clean:()=>{
            app.cleaner.junks.known.forEach((file)=>{
                var ext = file.substr(file.lastIndexOf('.') + 1);
                switch(true){
                    case (ext=="mp3" || ext=="m4a" || ext=="aac" || ext=="wav"):
                    app.shell( `mv "/sdcard/${file}" "/sdcard/Music/"`)
                    console.log(`Cleaned :${file}`)
                    break;
                    case (ext=="png" || ext=="jpeg" || ext=="jpg"):
                    app.shell(`mv "/sdcard/${file}" "/sdcard/DCIM/Pictures/"`)
                    console.log(`Cleaned :${file}`)
                    break;
                    case (ext=="mp4"):
                    console.log(`mv "/sdcard/${file}" "/sdcard/Videos/"`)
                    app.shell(`mv "/sdcard/${file}" "/sdcard/Video/"`)
                    console.log(`Cleaned :${file}`)
                    break;
                }
            })
        }

    },
    openFolder: (name,callback) => {
        var list = [];
        
            client.readdir(app.device.id, name)
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
        
    },
    listsdFolders:(callback)=>{
    	var list=[];
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
    },
    shell:(command)=>{
        return client.shell(app.device.id, command)
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
                    $('#folders').append(`<tr><td onclick="app.render.folder(app.render.currentFolder+'/${item}')">${item}</td><td>${ext}</td></tr>`)
                })
            })
        },
        Upload:(files)=>{
            
        },
        recieveDrop:(e)=>{
            e.preventDefault();
            var files = e.originalEvent.dataTransfer.files;
            $('#circle').circleProgress({startAngle: -Math.PI / 2,value: 0,lineCap: 'round',fill: {color: '#ffa500'}});
            $("#Transfer").modal('show')
            for (let f of files) {
                var thread = new Worker('uploader.js');
                thread.postMessage(f.path);
                thread.onmessage = (e)=>{
                    if(typeof e.data == "string"){
                        $('#circle').circleProgress('value',1)
                        .on('circle-animation-progress', function(event, progress, stepValue) {
                        $(this).find('strong').text(Math.round(100));
                        });
                        $("#Transfer").modal('hide')
                        delete thread;
                        }else{
                        $('#circle').circleProgress('value',(e.data*0.01))
                        .on('circle-animation-progress', function(event, progress, stepValue) {
                            $(this).find('strong').text((Math.round(e.data)==100)? 99:Math.round(e.data));
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
    //$('#video').on('drop',(e)=>{app.render.recieveDrop(e)});
    //$('#video').on('dragover',(e)=>$(e.target).addClass('hvr-underline-from-center'));
    //$('#video').on('dragleave dragend',(e)=>{$(e.target).removeClass('hvr-underline-from-center');console.log("over")});

  $('#video').on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
  })
  .on('dragover dragenter', function(e) {
    console.log(e.originalEvent.dataTransfer.files)
    $('#video').addClass('hvr-underline-from-center');
  })
  .on('dragleave dragend drop', function() {
    $('#video').removeClass('hvr-underline-from-center');
  })
  .on('drop', function(e) {
    app.render.recieveDrop(e)
  });
});