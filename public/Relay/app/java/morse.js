/*
 * echotest.js
 *
 * Derived from Echo Test of WebSocket.org (http://www.websocket.org/echo.html).
 *
 * Copyright (c) 2012 Kaazing Corporation.
 */

var url = "ws://192.168.43.131:4649/Morse";
//var url = "wss://localhost:5963/Echo";
var output;
var overlay;
var UID;
var connected;
var sentUID;
var uidInput;

var sendUIDEvent = document.createEvent("Event");
sendUIDEvent.initEvent("sendUID",true,true);

var sendCloseEvent = document.createEvent("Event");
sendCloseEvent.initEvent("sendClose",true,true);

var sendNextEvent = document.createEvent("Event");
sendNextEvent.initEvent("sendNext",true,true);

var sendUpEvent = document.createEvent("Event");
sendUpEvent.initEvent("sendUp",true,true);

var sendDownEvent = document.createEvent("Event");
sendDownEvent.initEvent("sendDown",true,true);

window.addEventListener ("load", Init, false);

function Init () {
  output = document.getElementById ("output");
  overlay = document.getElementById ("overlay");
  UID = document.getElementById ("serverKey");
  //findServers();
  // DoWebSocket();
  GetLocalIP(SetIP);
}

function GetLocalIP(callback)
{
    var ip_dups = {};

    //compatibility for firefox and chrome
    var RTCPeerConnection = window.RTCPeerConnection
        || window.mozRTCPeerConnection
        || window.webkitRTCPeerConnection;
    var useWebKit = !!window.webkitRTCPeerConnection;

    //bypass naive webrtc blocking using an iframe
    if(!RTCPeerConnection){
        //NOTE: you need to have an iframe in the page right above the script tag
        //
        //<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
        //<script>...getIPs called in here...
        //
        var win = iframe.contentWindow;
        RTCPeerConnection = win.RTCPeerConnection
            || win.mozRTCPeerConnection
            || win.webkitRTCPeerConnection;
        useWebKit = !!win.webkitRTCPeerConnection;
    }

    //minimal requirements for data connection
    var mediaConstraints = {
        optional: [{RtpDataChannels: true}]
    };

    var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

    //construct a new RTCPeerConnection
    var pc = new RTCPeerConnection(servers, mediaConstraints);

    function handleCandidate(candidate){
        //match just the IP address
        var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
        var ip_addr = ip_regex.exec(candidate)[1];

        //remove duplicates
        if(ip_dups[ip_addr] === undefined)
            callback(ip_addr);

        ip_dups[ip_addr] = true;
    }

    //listen for candidate events
    pc.onicecandidate = function(ice){

        //skip non-candidate events
        if(ice.candidate)
            handleCandidate(ice.candidate.candidate);
    };

    //create a bogus data channel
    pc.createDataChannel("");

    //create an offer sdp
    pc.createOffer(function(result){

        //trigger the stun server request
        pc.setLocalDescription(result, function(){}, function(){});

    }, function(){});

    //wait for a while to let everything done
    setTimeout(function(){
        //read candidate info from local description
        var lines = pc.localDescription.sdp.split('\n');

        lines.forEach(function(line){
            if(line.indexOf('a=candidate:') === 0)
                handleCandidate(line);
        });
    }, 1000);
}

var socketConnections = [];
var deviceIP;
function SetIP(ip)
{
    if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/))
    {
      deviceIP = ip;
       var split = ip.split(".");
       

        for(var i = 0; i < 255; i++)
        {

          ip = split[0] + "." + split[1] + "." + split[2] + "." + i;
          // ip = "localhost";
            TryConnectToIP(ip);
        }
    }
}

function TryConnectToIP(ip)
{
  url = "ws://"+ip+":4649/Morse";
  // console.log(url);

  var sock = new WebSocket(url);

  // var timer = setTimeout(function() {
  //   if(sock)
  //   {
  //     sock.close();
  //   }
  // }, 3500);

  sock.onopen = function (e) {
    socketConnections.push(sock);
    console.log("send ping to " + sock.url);
    sock.send(deviceIP+":Ping");
    
  };

  sock.onmessage = function (e) {
    if(e.data == "Pong")
    {
      console.log("connected to  " + ip);

      //this will just connect to the first one to respond. Need to key it in with a unique ID provided by user.
      // display text boxes, and send out a message to server to confirm UID.
      // also confirm with server if there is currently an ongoing connection, if so close this connection.
      // once thats confrimed, then close any other connections.
      // also close connection with server once app is closed etc.
      
    }

    if(e.data == "uidMatch" && sentUID)
    {
      for(var i = 0; i < socketConnections.length; i++)
      {
        if(socketConnections[i].url != sock.url)
        {
          console.log("closing on url " + socketConnections[i].url);
          socketConnections[i].close();
        }
      }

      console.log("Connected");
      connected = true;
      // connection = sock;
      overlay.style.display = "none";
      UID.style.display = "none";
    }
  };

  document.addEventListener('sendUID', function (e) {
    sock.send(deviceIP+":"+uidInput);
    console.log("Send UID event");
  }, false);

  document.addEventListener('sendClose', function (e) {
    sock.send(deviceIP+":"+"close");
    console.log("Send close event");
  }, false);

  document.addEventListener('sendNext', function (e) {
    sock.send(deviceIP+":"+"2");
    console.log("Send next event");
  }, false);

  document.addEventListener('sendUp', function (e) {
    sock.send(deviceIP+":"+"1");
    console.log("Send Up event");
  }, false);

  document.addEventListener('sendDown', function (e) {
    sock.send(deviceIP+":"+"0");
    console.log("Send Down event");
  }, false);

}


function SendUIDToServer(uid)
{
  sentUID = true;
  uidInput = uid;
  document.dispatchEvent(sendUIDEvent);
}

window.onbeforeunload = function() {
  document.dispatchEvent(sendCloseEvent);
};

function DoWebSocket () {
  websocket = new WebSocket (url);

  console.log("connecting");

  websocket.onopen = function (e) {
    OnOpen (e);
  };

  websocket.onmessage = function (e) {
    OnMessage (e);
  };

  websocket.onerror = function (e) {
    OnError (e);
  };

  websocket.onclose = function (e) {
    OnClose (e);
  };
}

function OnOpen (event) {
  console.log("Connected");
  overlay.style.display = "none";
}

function OnMessage (event) {
  // websocket.close ();
  console.log(event.data);
}

function OnError (event) {
  console.log("error " + event.data);
  websocket.close ();
}

function OnClose (event) {
  console.log("close " + event.data);
}

function Send (message) {
  websocket.send (message);
}

//game inputs

function Down()
{
  if(connected)
  {
    document.dispatchEvent(sendDownEvent);
  }
}
function Up()
{
  if(connected)
  {
    document.dispatchEvent(sendUpEvent);
  }
}
function Next()
{
  if(connected)
  {
    document.dispatchEvent(sendNextEvent);
  }
}

