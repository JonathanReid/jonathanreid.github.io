var MESSAGE_START = "start";

var SLOT_ONE = "slotOne";
var SLOT_TWO = "slotTwo";

var CURRENT_SLOT;
var OTHER_SLOT;
var messages = [];
var waitingForPlayerTwo = false;
var readyToStart = false;
var gameReadyEvent;
var removeGameMessaged = false;

window.onbeforeunload = function(e) {
closeConnection();
};

function createConnection()
{
  // console.log(localStorage.getItem(SLOT_ONE));
  if(localStorage.getItem(SLOT_ONE) === null)
  {
    CURRENT_SLOT = SLOT_ONE;
    OTHER_SLOT = SLOT_TWO;
    localStorage.setItem(CURRENT_SLOT,1);

  }
  else if(localStorage.getItem(SLOT_TWO) === null)
  {
    CURRENT_SLOT = SLOT_TWO;
    OTHER_SLOT = SLOT_ONE;
    localStorage.setItem(CURRENT_SLOT,1);
  }

  localStorage.setItem(CURRENT_SLOT+"_DATA",JSON.stringify(messages));
// console.log("I AM SLOT: " + CURRENT_SLOT);

  if(CURRENT_SLOT == SLOT_ONE)
  {
    waitingForPlayerTwo = true;
  }
  else {
    sendData(SLOT_TWO);
    beginGame();
  }

  this.worker = new Worker('worker.js');
  var context = this;
  this.worker.onmessage = function(event)
  {
    context.updateData();
  };

}

function startWorker()
{
  removeGameMessaged = true;
}

function stopWorker()
{
  removeGameMessaged = false;
}

function reset()
{
  messages = [];
  localStorage.setItem(CURRENT_SLOT+"_DATA",JSON.stringify(messages));
}

function resetOtherInstance()
{
  sendData("RESET");
}

function setHowGameCompleted(completed)
{
  localStorage.setItem("COMPLETED",completed);
}

function getHowGameCompleted()
{
  return localStorage.getItem("COMPLETED");
}

function closeConnection()
{
  localStorage.removeItem(CURRENT_SLOT);
  localStorage.removeItem(CURRENT_SLOT+"_DATA");

  //in case of data error...
  // localStorage.removeItem(SLOT_ONE);
  // localStorage.removeItem(SLOT_ONE+"_DATA");
  // localStorage.removeItem(SLOT_TWO);
  // localStorage.removeItem(SLOT_TWO+"_DATA");
}

function sendData(data)
{
  var msg = JSON.parse(localStorage.getItem(OTHER_SLOT+"_DATA"));
  if(msg == null)
  {
    msg = [];
  }
  msg.push(data);
  localStorage.setItem(OTHER_SLOT+"_DATA",JSON.stringify(msg));
}

function recievedData(data)
{
  if(waitingForPlayerTwo && data === SLOT_TWO)
  {
    beginGame();
    recievedEvent(data);
  }
  else if(data == "RESET")
  {
    fireEvent("gameResetEvent");
    stopWorker();
    recievedEvent(data);
  }
  else {
      // console.log("RECEIVED DATA:: " + data);
      fireEvent("gameMessage", data);
  }
}

function beginGame()
{
  // console.log("START GAME");
  readyToStart = true;
  fireEvent("gameReadyEvent");
}


function fireEvent(eventName, data)
{
  var selectionFired = new CustomEvent(eventName,{ "detail": data});

  document.dispatchEvent(selectionFired);
}

function isReadyToStart()
{
  return readyToStart;
}

function isStartingFuture()
{
  return CURRENT_SLOT == SLOT_TWO;
}

function updateData()
{
  var data = JSON.parse(localStorage.getItem(CURRENT_SLOT+"_DATA"));
  if(data !== null)
  {
    if(data.length > 0)
    {
      for(let i = 0; i < data.length; ++i)
      {
        var msg = data[i];
        recievedData(msg);
        if(removeGameMessaged)
        {

        }

        // data.splice(0,1);
        // localStorage.setItem(CURRENT_SLOT+"_DATA",JSON.stringify(data));
      }
    }
  }
}

function recievedEvent(msg)
{
  var data = JSON.parse(localStorage.getItem(CURRENT_SLOT+"_DATA"));
  for(let i = 0; i < data.length; ++i)
  {
    var m = data[i];
    if(m == msg)
    {
      console.log("RECEIVED " + msg);
      data.splice(0,1);
      localStorage.setItem(CURRENT_SLOT+"_DATA",JSON.stringify(data));
    }
  }
}

function setSharedData(data)
{
  localStorage.setItem("SHARED_SLOT",data);
}

function getSharedData()
{
  return localStorage.getItem("SHARED_SLOT");
}
