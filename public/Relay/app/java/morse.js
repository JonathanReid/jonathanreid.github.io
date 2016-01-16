var SERVER_ADDRESS = "ws://relayserver-jonsgames.rhcloud.com:8000";

//****** BUTTONS ******
var connectingButton;
var retryButton;
var sentUID;
var uidInput;
var joinButton;

//****** SERVER STATUS ******
var address;
var UID;
var connected;
var retries = 0;

//****** VIEWS ******
var introScreen;
var connectingScreen;
var failedConnectionScreen;
var pairingScreen;
var gameScreen;

//****** GAME MESSAGES ******
var CLOSE_MESSAGE = "Close";
var DOWN_MESSAGE = "0";
var UP_MESSAGE = "1";
var NEXT_MESSAGE = "2";
var SHUTDOWN_MESSAGE = "Shutdown";
var NO_UDID_MATCH_MESSAGE = "NoUDIDMatch";


//****** GAME EVENTS *******
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
  UID = document.getElementById ("serverKey");

  introScreen = document.getElementById("introScreen");
  connectingScreen = document.getElementById("connectingScreen");
  failedConnectionScreen = document.getElementById("failedConnectionScreen");
  pairingScreen = document.getElementById("pairingScreen");
  gameScreen = document.getElementById("gameScreen");

  connectingButton = document.getElementById("tryConnect");
  retryButton = document.getElementById("retry");
  joinButton = document.getElementById("connectButton");

  ShowIntroScreen();
  // ShowConnectingScreen();

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
    joinButton.addEventListener('touchstart', GetUID, false);
  }
  else
  {
    document.getElementById("key").addEventListener("mousedown", Down, false);
    window.addEventListener("mouseup", Up, false);
    document.getElementById("next").addEventListener("mousedown", Next, false);

    connectingButton.addEventListener('mousedown', StartConnection, false);
    retryButton.addEventListener('mousedown', StartConnection, false);
    joinButton.addEventListener('mousedown', GetUID, false);
  }
}

function ShowIntroScreen()
{
  introScreen.style.display = "block";
  connectingScreen.style.display = "none";
  failedConnectionScreen.style.display = "none";
  pairingScreen.style.display = "none";
  gameScreen.style.display = "none";
  connectButton.style.display = "none";
}

function ShowConnectingScreen()
{
  introScreen.style.display = "none";
  connectingScreen.style.display = "block";
  failedConnectionScreen.style.display = "none";
  pairingScreen.style.display = "none";
  gameScreen.style.display = "none";
  connectButton.style.display = "none";

  PlayConnectingAnimation();
}

function ShowFailedConnectingScreen()
{
  introScreen.style.display = "none";
  connectingScreen.style.display = "none";
  failedConnectionScreen.style.display = "block";
  pairingScreen.style.display = "none";
  gameScreen.style.display = "none";
  connectButton.style.display = "none";
}

function ShowPairingScreen()
{
  introScreen.style.display = "none";
  connectingScreen.style.display = "none";
  failedConnectionScreen.style.display = "none";
  pairingScreen.style.display = "block";
  gameScreen.style.display = "none";
  connectButton.style.display = "none";
}

function ShowGameScreen()
{
  introScreen.style.display = "none";
  connectingScreen.style.display = "none";
  failedConnectionScreen.style.display = "none";
  pairingScreen.style.display = "none";
  gameScreen.style.display = "block";
  connectButton.style.display = "none";
}

function StartConnection()
{
  document.dispatchEvent(killConnectionEvent);

  ShowConnectingScreen();
  console.log("start connecting");
  
  ConnectToRemoteServer();
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

function PlayConnectingAnimation()
{
  connectingScreen.innerHTML = "<p>...</p>";
  /*
  var text = ["-.-.","---","-.","-.",".","-.-.","-","..","-.","--."];
  var index = 0;
  var charIndex = 0;
  var letter = "";
  var currentChar = text[index];

  DisplayLetter();

  function DisplayLetter()
  {
    letter += currentChar.charAt(charIndex);

    connectingScreen.innerHTML = "<p>" + letter +"</p>";

    charIndex ++;
    if(charIndex >= currentChar.length)
    {
      DisplayNextLetter();
    }
    else
    {
      var time = 250;
      if(currentChar.charAt(charIndex-1) == "-")
      {
        time = 500;
      }
      setTimeout(function()
      {
        DisplayLetter();

      },time);
    }
  }

  function DisplayNextLetter()
  {
    letter = "";

    index ++;
    var time = 500;
    if(index >= text.length)
    {
      index = 0;
      time = 1000;
    }

    currentChar = text[index];
    charIndex = 0;

    setTimeout(function()
    {
      Pause();

    },time);
  }

  function Pause()
  {
    connectingScreen.innerHTML = "";
    setTimeout(function()
    {
      DisplayLetter();

    },500);
  }*/
}

function ConnectToRemoteServer()
{
  var ws = new WebSocket(SERVER_ADDRESS);

  retries = 0;

  ws.onopen = function() {
    ws.send("CONNECTION-");
  };

  ws.onmessage = function (e) {
    
    console.log(e.data);
    if(e.data == "Fetch UID")
    {
      ShowPairingScreen();
    }
    else if(e.data.indexOf("server") > -1)
    {
      var d = e.data.split(":");
      address = "ws://"+d[1]+":4567/Server";
      ws.close();
      ShowConnectingScreen();
      ConnectToLocalServer();
    }
    else if(e.data == NO_UDID_MATCH_MESSAGE)
    {
        ws = null;  
        document.removeEventListener('sendUID', SendUDID, false);
        console.log("NO UDID MATCH");
        ShowFailedConnectingScreen();
    }
  };

  document.addEventListener('sendUID', SendUDID, false);

  function SendUDID()
  {
    console.log("UID " + uidInput);
      ws.send("UID:"+uidInput);
  }
}

function ConnectToLocalServer(ip)
{
  retries ++;
  var socket = new WebSocket(address);
  socket.onopen = function (e) {
      console.log("connect");
      connected = true;
      socket.send("Connected");
      ShowGameScreen();
      toggleFullScreen();
    };

    socket.onerror = function(e)
    {
      if(retries < 10)
      {
        setTimeout(function()
        {
          ResetSocket();
          ConnectToLocalServer();

        },1000);
      }
      else
      {
        ResetSocket();
        console.log("error");
        ShowFailedConnectingScreen();
      }
    }

    socket.onmessage = function (e) {
      if(SHUTDOWN_MESSAGE)
      {
        socket.close();
        ResetSocket();
        ShowIntroScreen();
      }
    };

    function ResetSocket()
    {
      document.removeEventListener('kill', Kill, false);
      document.removeEventListener('sendClose', SendClose, false);
      document.removeEventListener('sendNext', SendNext, false);
      document.removeEventListener('sendUp', SendUp, false);
      document.removeEventListener('sendDown', SendDown, false);
      socket = null;
    }

    document.addEventListener('kill', Kill, false);
    document.addEventListener('sendClose', SendClose, false);
    document.addEventListener('sendNext', SendNext, false);
    document.addEventListener('sendUp', SendUp, false);
    document.addEventListener('sendDown', SendDown, false);

    function Kill()
    {
      if(socket)
      {
        socket.close();
        socket = null;
      }
    }

    function SendClose()
    {
      if(socket)
        {
          socket.send(CLOSE_MESSAGE);
          console.log("Send close event");
        }
    }

    function SendNext()
    {
      if(socket)
        {
          socket.send(NEXT_MESSAGE);
          console.log("Send next event");
        }
    }

    function SendUp()
    {
      if(socket)
        {
          socket.send(UP_MESSAGE);
          console.log("Send Up event");
        }
    }

    function SendDown()
    {
      if(socket)
        {
          socket.send(DOWN_MESSAGE);
          console.log("Send Down event");
        }
    }

}

function ResetScreens()
{
  ShowIntroScreen();
}

function SendUIDToServer(uid)
{
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

    document.getElementById('uid1').value = "";
    document.getElementById('uid2').value = "";
    document.getElementById('uid3').value = "";
    document.getElementById('uid4').value = "";
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

//****** UTILS ******
function mobileAndTabletcheck() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

function toggleFullScreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
}

function CheckUID1()
{
  var letters = document.uidPair.uid1.value.length +1;
  document.getElementById('uid1').value = document.getElementById('uid1').value.toUpperCase();
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

  document.getElementById('uid2').value = document.getElementById('uid2').value.toUpperCase();
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
  document.getElementById('uid3').value = document.getElementById('uid3').value.toUpperCase();
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
  document.getElementById('uid4').value = document.getElementById('uid4').value.toUpperCase();
  if (letters4 <= 1)
  {
    document.uidPair.uid4.focus()
  }
  else
  {
    connectButton.style.display = "block";
  }
}

