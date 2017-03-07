const express = require ('express');
const http = require ('http');
const app = express ();
const server = http.createServer (app);
app.use ('/', express.static('.'));
const WebSocket = require ('ws');
const wss = new WebSocket.Server ({ server });
//const bluetooth = require ('node-bluetooth');
//const device = new bluetooth.DeviceINQ ();
var serial = require ('serialport');

var port = new serial ('/dev/rfcomm2', {baudRate: 9600});

var s;
wss.on ('connection', function (ws) {
  console.log ('connection');
  
  ws.on ('message', function (message) {
    console.log ('Receive: ' +  message);
  });

  s = ws;
});

port.on ('open', function (err) {

  if (err) {
    console.log (err);
    return;
  }
    
  port.on ('data', function (data) {
    //var ab = toArrayBuffer (data);
    if (s == undefined) {
//     console.log ('no socket');
    } else {
      s.send (data); 
    }
      
  });
});



server.listen (8080, function () {
  console.log ('http listen on port 8080');
});


// function toArrayBuffer (buf) {
//   var ab = new ArrayBuffer (buf.length);
//   var view = new Uint8Array (ab);
//   for (var i = 0; i < buf.length; i++) {
//     view[i] = buf[i];
//   }

//   return ab;
// }

/*
device.listPairedDevices (console.log);
device.on ('found', function (address, name) {
    console.log (address + ": " + name );
  if (address != '00:14:C5:A1:04:1B') {return;}
  device.findSerialPortChannel (address, function (channel) {
    console.log ('channel: ' + channel);

    bluetooth.connect (address, channel, function (err, connection) {
      if (err) return console.log (err); 
      console.log (connection);
      console.log (connection.prototype);
    });
  });
}).inquire ();*/
