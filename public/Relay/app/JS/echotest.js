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
  doWebSocket ();
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

window.addEventListener ("load", init, false);