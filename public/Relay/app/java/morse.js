/*
 * echotest.js
 *
 * Derived from Echo Test of WebSocket.org (http://www.websocket.org/echo.html).
 *
 * Copyright (c) 2012 Kaazing Corporation.
 */

var url = "ws://127.0.0.1:4649/Morse";
//var url = "wss://localhost:5963/Echo";
var output;
var overlay;

function init () {
  output = document.getElementById ("output");
  overlay = document.getElementById ("overlay");
  findServers();
}

function doWebSocket () {
  websocket = new WebSocket (url);

  websocket.onopen = function (e) {
    onOpen (e);
  };

  websocket.onmessage = function (e) {
    onMessage (e);
  };

  websocket.onerror = function (e) {
    onError (e);
  };

  websocket.onclose = function (e) {
    onClose (e);
  };
}

function onOpen (event) {
  send ("Connected");
  overlay.style.display = "none";
}

function onMessage (event) {
  // websocket.close ();
}

function onError (event) {
  websocket.close ();
}

function onClose (event) {

}

function send (message) {
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

function findServers(port, ipBase, ipLow, ipHigh, maxInFlight, timeout, cb) {
    var ipCurrent = +ipLow, numInFlight = 0, servers = [];
    ipHigh = +ipHigh;

    function tryOne(ip) {
        ++numInFlight;
        var address = "ws://" + ipBase + ip + ":" + port +"/Morse";
        var socket = new WebSocket(address);
        var timer = setTimeout(function() {
            // console.log(address + " timeout");
            var s = socket;
            socket = null;
            s.close();
            --numInFlight;
            next();
        }, timeout);
        socket.onopen = function() {
            if (socket) {
                console.log(address + " success");
                clearTimeout(timer);
                servers.push(socket.url);
                --numInFlight;
                cb(servers);
                // next();
            }
        };
        socket.onerror = function(err) {
            if (socket) {
                console.log(address + " error");
                clearTimeout(timer);
                --numInFlight;
                next();
            }
        }
    }

    function next() {
        while (ipCurrent <= ipHigh && numInFlight < maxInFlight) {
            tryOne(ipCurrent++);
        }
        // if we get here and there are no requests in flight, then
        // we must be done
        if (numInFlight === 0) {
            // console.log(servers);
            cb(servers);
        }
    }

    next();
}

findServers(4649, "192.168.0.", 1, 255, 20, 4000, function(servers) {
    
    url = servers[0];
    console.log(url);
    doWebSocket ();
});

window.addEventListener ("load", init, false);