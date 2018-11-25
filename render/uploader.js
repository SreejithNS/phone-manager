var adb = require('adbkit')
var Promise = require('bluebird')
var client = adb.createClient();
var path = require('path');
var fs = require('fs');

onmessage = (e)=>{
var filePath = e.data;
var stats = fs.statSync(filePath);
var fileSize = stats["size"];

client.listDevices()
  .then(function(devices) {
    return Promise.map(devices, function(device) {
      return client.push(device.id, filePath, '/sdcard/'+path.basename(filePath))
        .then(function(transfer) {
          return new Promise(function(resolve, reject) {
            transfer.on('progress', function(stats) {
              let byte = stats.bytesTransferred;
              let percent = Math.floor((byte/fileSize)*100);
              //if(percent == 20 || percent == 40 || percent == 60 || percent == 80 || percent == 90 || percent > 95){
                postMessage(percent);
              //}
            })
            transfer.on('end', function() {
              postMessage('end');
              resolve()
            })
            transfer.on('error', reject)
          })
        })
    })
  })
  .then(function() {
    console.log('Done pushing')
  })
  .catch(function(err) {
    console.error('Something went wrong:', err.stack)
  })
}