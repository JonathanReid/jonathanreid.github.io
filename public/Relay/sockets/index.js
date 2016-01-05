var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
 res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('msg', function(msg){
    io.emit('msg');
  });
});

http.listen(4567, function(){
  console.log('listening on *:4567');
});