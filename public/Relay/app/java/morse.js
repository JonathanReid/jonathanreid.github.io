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

window.addEventListener ("load", Init, false);

function Init () {
  output = document.getElementById ("output");
  overlay = document.getElementById ("overlay");
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
function SetIP(ip)
{
    if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/))
    {
       var split = ip.split(".");
       

        for(var i = 0; i < 255; i++)
        {

          ip = split[0] + "." + split[1] + "." + split[2] + "." + i;
          url = "ws://"+ip+":4649/Morse";

          var sock = new WebSocket(url);

          var timer = setTimeout(function() {
            sock.close();
          }, 3500);

          sock.onopen = function (e) {
            socketConnections.push(sock);
            sock.send("Ping");

          };

          sock.onmessage = function (e) {
            if(e.data == "Pong")
            {
              for(var j = socketConnections.length; j > -1 ; j--)
              {
                if(socketConnections[j] != sock)
                {
                  socketConnections[j].close();
                  socketConnections.splice(j,1);
                }
              }

              OnOpen(e);
            }
          };  
        }
    }
}

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
  Send ("Connected");

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

function Down()
{
  websocket.send ("0");
}
function Up()
{
  websocket.send ("1");
}
function Next()
{
  websocket.send ("2");
}

function FindServers(port, ipBase, ipLow, ipHigh, maxInFlight, timeout, cb) {

// can replace this by mass connecting to all at once, store an array of any servers that returned a connection,
// and then use a unique key to lock the connection to the server. This mitigates connecting to the wrong game instance.

    var ipCurrent = +ipLow, numInFlight = 0, servers = [];
    ipHigh = +ipHigh;

    function TryOne(ip) {
        ++numInFlight;
        var address = "ws://" + ipBase + ip + ":" + port +"/Morse";
        var socket = new WebSocket(address);
        var timer = setTimeout(function() {
            // console.log(address + " timeout");
            var s = socket;
            socket = null;
            s.close();
            --numInFlight;
            Next();
        }, timeout);
        socket.onopen = function() {
            if (socket) {
                console.log(address + " success");
                clearTimeout(timer);
                servers.push(socket.url);
                --numInFlight;
                cb(servers);
                // Next();
            }
        };
        socket.onerror = function(err) {
            if (socket) {
                console.log(address + " error");
                clearTimeout(timer);
                --numInFlight;
                Next();
            }
        }
    }

    function Next() {
        while (ipCurrent <= ipHigh && numInFlight < maxInFlight) {
            TryOne(ipCurrent++);
        }
        // if we get here and there are no requests in flight, then
        // we must be done
        if (numInFlight === 0) {
            // console.log(servers);
            cb(servers);
        }
    }

    Next();
}

/*findServers(4649, "192.168.0.", 1, 255, 20, 4000, function(servers) {
    
    url = servers[0];
    console.log(url);
    doWebSocket ();
});
*/
