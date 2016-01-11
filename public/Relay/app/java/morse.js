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
var UID;
var connectingButton;
var retryButton;
var foundServer = false;
var connected = false;
var connectionName = "";
var allowingConnections = false;
var sentUID;
var uidInput;

var introScreen;
var connectingScreen;
var failedConnectionScreen;
var pairingScreen;
var gameScreen;

var CLOSE_MESSAGE = "Close";
var PING_MESSAGE = "Ping";
var PONG_MESSAGE = "Pong";
var UID_MESSAGE = "UidMatch";
var UID_WRONG_MESSAGE = "UidIncorrect";
var NO_CONNECTION_MESSAGE = "NoConnection";
var DOWN_MESSAGE = "0";
var UP_MESSAGE = "1";
var NEXT_MESSAGE = "2";
var SHUTDOWN_MESSAGE = "Shutdown";

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

var killConnectionEvent = document.createEvent("Event");
killConnectionEvent.initEvent("kill",true,true);

window.addEventListener ("load", Init, false);

function Init () {
  output = document.getElementById ("output");
  UID = document.getElementById ("serverKey");

  introScreen = document.getElementById("introScreen");
  connectingScreen = document.getElementById("connectingScreen");
  failedConnectionScreen = document.getElementById("failedConnectionScreen");
  pairingScreen = document.getElementById("pairingScreen");
  gameScreen = document.getElementById("gameScreen");

  connectingButton = document.getElementById("tryConnect");
  retryButton = document.getElementById("retry");

  ShowIntroScreen();

  SetUpInput();
}

function SetUpInput()
{
  var useTouch = mobileAndTabletcheck();

  if(useTouch)
  {
    document.getElementById("key").addEventListener('touchstart', Down, false);
    window.addEventListener('touchend', Up, false);
    document.getElementById("next").addEventListener('touchstart', Next, false);

    connectingButton.addEventListener('touchstart', StartConnection, false);
    retryButton.addEventListener('touchstart', StartConnection, false);
  }
  else
  {
    document.getElementById("key").addEventListener("mousedown", Down, false);
    window.addEventListener("mouseup", Up, false);
    document.getElementById("next").addEventListener("mousedown", Next, false);

    connectingButton.addEventListener('mousedown', StartConnection, false);
    retryButton.addEventListener('mousedown', StartConnection, false);
  }
}

function ShowIntroScreen()
{
  introScreen.style.display = "block";
  connectingScreen.style.display = "none";
  failedConnectionScreen.style.display = "none";
  pairingScreen.style.display = "none";
  gameScreen.style.display = "none";
}

function ShowConnectingScreen()
{
  introScreen.style.display = "none";
  connectingScreen.style.display = "block";
  failedConnectionScreen.style.display = "none";
  pairingScreen.style.display = "none";
  gameScreen.style.display = "none";
}

function ShowFailedConnectingScreen()
{
  introScreen.style.display = "none";
  connectingScreen.style.display = "none";
  failedConnectionScreen.style.display = "block";
  pairingScreen.style.display = "none";
  gameScreen.style.display = "none";
}

function ShowPairingScreen()
{
  introScreen.style.display = "none";
  connectingScreen.style.display = "none";
  failedConnectionScreen.style.display = "none";
  pairingScreen.style.display = "block";
  gameScreen.style.display = "none";
}

function ShowGameScreen()
{
  introScreen.style.display = "none";
  connectingScreen.style.display = "none";
  failedConnectionScreen.style.display = "none";
  pairingScreen.style.display = "none";
  gameScreen.style.display = "block";
}

function StartConnection()
{
  document.dispatchEvent(killConnectionEvent);

  ShowConnectingScreen();
  console.log("start connecting");
  TryConnectToIP("localhost");
  allowingConnections = true;

  setTimeout(CouldntFindConnection, 60000);
}

function CouldntFindConnection()
{
  if(!connected && !foundServer)
  {
    allowingConnections = false;
    ShowFailedConnectingScreen();
    document.dispatchEvent(killConnectionEvent);
  }
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
    var sock = new WebSocket("ws://"+ip+":4649/Morse");

    console.log("trying ip " + ip);
    setTimeout(function()
      {
        if(sock && !foundServer)
        {
          sock.close();
          sock = null;
        }
      }, 3000);

    sock.onopen = function (e) {
      if(allowingConnections && !connected)
      {
        socketConnections.push(sock);
        console.log("send ping to " + sock.url);
        console.log("connected? " + connected);
        sock.send(PING_MESSAGE+":");
        foundServer = true;
      }
      else
      {
        sock.close();
      }
    };

    sock.onmessage = function (e) {
      if(!allowingConnections)
      {
        sock.close();
      }
      else
      {
        if(e.data == PONG_MESSAGE)
        {
          ShowPairingScreen();
          console.log("connected to  " + ip);
          foundServer = true;
        }
        else if(e.data == UID_MESSAGE && sentUID)
        {
          for(var i = 0; i < socketConnections.length; i++)
          {
            if(socketConnections[i].url != sock.url)
            {
              console.log("closing on url " + socketConnections[i].url);
              socketConnections[i].close();
            }
          }

          ConnectedToGameInsance();
        }
        else if(e.data == UID_WRONG_MESSAGE)
        {
          console.log("incorrect UID");
        }
        else if(e.data == NO_CONNECTION_MESSAGE)
        {
          console.log("CLOSING");
          sock.close();
          ResetScreens();
        }
        else if(e.data == SHUTDOWN_MESSAGE)
        {
          console.log("CLOSING");
          sock.close();
          ResetScreens();
        }
        else
        {
          if(connectionName == "")
          {
            connectionName = e.data;
          }
        }
      }
    };

    sock.onerror = function (e) 
    {
      //if failed to connect to local host, try the other versions.
      if(ip == "localhost")
      {
        GetLocalIP(SetIP);
      }
    }

    document.addEventListener('kill', function (e) {
      if(sock)
      {
        sock.close();
        sock = null;
      }
    }, false);

    document.addEventListener('sendUID', function (e) {
      
      if(foundServer)
      {
        if(sock)
        {
          sock.send(uidInput+":");    
          console.log("Send UID event");
        }
      }
    }, false);

    document.addEventListener('sendClose', function (e) {
      if(connected)
      {
        if(sock)
        {
          sock.send(CLOSE_MESSAGE+":"+connectionName);
          console.log("Send close event");
        }
      }
    }, false);

    document.addEventListener('sendNext', function (e) {
      if(connected)
      {
        if(sock)
        {
          sock.send(NEXT_MESSAGE+":"+connectionName);
          console.log("Send next event");
        }
      }
    }, false);

    document.addEventListener('sendUp', function (e) {
      if(connected)
      {
        if(sock)
        {
          sock.send(UP_MESSAGE+":"+connectionName);
          console.log("Send Up event");
        }
      }
    }, false);

    document.addEventListener('sendDown', function (e) {
      if(connected)
      {
        if(sock)
        {
          sock.send(DOWN_MESSAGE+":"+connectionName);
          console.log("Send Down event");
        }
      }
    }, false);

}

function ResetScreens()
{
  ShowIntroScreen();
  connected = false;
  foundServer = false;
  connectionName = "";
}

function ConnectedToGameInsance()
{
  ShowGameScreen();
  console.log("connected");
  connected = true;
  // connection = sock;
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

//game inputs

function GetUID()
{
    SendUIDToServer(document.getElementById('uid1').value+document.getElementById('uid2').value+document.getElementById('uid3').value+document.getElementById('uid4').value);
}

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

function mobileAndTabletcheck() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

function CheckUID1()
{
  var letters = document.uidPair.uid1.value.length +1;
  if (letters <= 1)
  {
    document.uidPair.uid1.focus()
  }
  else
  {
    document.uidPair.uid2.focus()
  }
}

<!-- This code makes the jump from textbox two to text box three -->
function CheckUID2()
{
  var letters2 = document.uidPair.uid2.value.length +1;
  if (letters2 <= 1)
  {
    document.uidPair.uid2.focus()
  }
  else
  {
    document.uidPair.uid3.focus()
  }
}

<!-- This code makes the jump from textbox three to textbox four -->
function CheckUID3()
{
  var letters3 = document.uidPair.uid3.value.length +1;
  if (letters3 <= 1)
  {
    document.uidPair.uid3.focus()
  }
  else
  {
    document.uidPair.uid4.focus()
  }
}

<!-- This code makes the jump from textbox four to the submit button -->
function CheckUID4()
{
  var letters4 = document.uidPair.uid4.value.length +1;
  if (letters4 <= 1)
  {
    document.uidPair.uid4.focus()
  }
  else
  {
    GetUID();
  }
}

