const canvas = document.querySelector("canvas");
canvas.height = 600;
canvas.width = 800;
console.log("canvas");
const c = canvas.getContext("2d");
var drawing = [];
var positions = [];
var size = "5";
var color = "black";
var n = false;
var guessed = false;
var gtimer = undefined;
var timerinterval = undefined;
//setColour
const setColour = (colour) => {
  color = colour;
  document.documentElement.scrollTop=0
};


//setSize
const setSize = (s) => {
  size = s;
  document.documentElement.scrollTop=0
};

const socket = io();

const reset = () => {
  socket.emit("reset-game", "true");
};
socket.on("reset", (msg) => {
  window.location.reload();
});
var word = undefined;
marker = document.querySelector(".markers");
colorButtons = document.querySelector(".buttons");
guessDiv = document.querySelector(".guess");
//promt
const id = Math.floor(Math.random() * 10000);

if (!localStorage.name) {
  const name = prompt("Enter Your name");
  localStorage.name = name;
  n = true;
} else {
  name = localStorage.name;
}
if (name) {
  socket.emit("new-user", { id: id, name: name });
} else {
  window.location.reload();
}

//point
function Point(x, y, color, size) {
  this.x = x;
  this.y = y;
  this.color = color;
  this.size = size;
}

//clear
const cl = () => {
  drawing = [];
  draw();
  socket.emit("clear", "clear");
};

//mouse
var mouse = {
  x: undefined,
  y: undefined,
};

//eraser
var clicked = false;
var eraser = false;
const clickT = function (e) {
  clicked = true;
};
const clickF = function (e) {
  clicked = false;
};

//setMousePosition
const setMousePos = function (e) {
  if (clicked && e.srcElement == canvas) {
    const point = new Point(
      e.x - canvas.offsetLeft,
      e.y - canvas.offsetTop,
      color,
      size
    );
    drawing.push(point);
    socket.emit("success", { point: point });
    draw();
  }
};

//socket new user
socket.on("r-users", function (data) {
  const usersr = document.querySelectorAll(".user");
  const users = document.querySelector(".users");
  const startBut = document.querySelectorAll(".abc");
  if (startBut) {
    startBut.forEach((element) => {
      element.remove();
    });
  }
  usersr.forEach((element) => {
    element.remove();
  });
  if (data.admin.id == id) {
    startButton = document.createElement("button");
    startButton.innerText = "Start";
    startButton.classList.add("abc");
    users.appendChild(startButton);
    startButton.addEventListener("click", function (e) {
      startButton.style.display = "none";
      socket.emit("continue", "abc");
    });

    document.querySelectorAll(".bt").forEach((element) => {
      element.style.display = "block";
    });

    endButton = document.createElement("button");
    endButton.innerText = "End";
    endButton.classList.add("abc");
    endButton.addEventListener("click", () => {
      close();
    });
    document.querySelector("#word-dis").appendChild(endButton);
  }
  data.users.forEach((element) => {
    var user = document.createElement("div");
    var name = document.createElement("p");
    name.innerText = element.name + "\n" + element.score;
    user.appendChild(name);
    user.classList.add("user");
    users.appendChild(user);
  });
});

//start/next
const next = () => {
  socket.emit("continue", "start");
};

//draw lines
const draw = () => {
  c.clearRect(0, 0, canvas.width, canvas.height);
  drawing.forEach((point) => {
    c.beginPath();
    c.lineWidth = point.size;
    c.lineCap = "round";
    c.strokeStyle = point.color;
    c.moveTo(point.x, point.y);
    c.lineTo(point.x, point.y);
    c.stroke();
  });
};

//socket recieve drawing
socket.on("draw", function (msg) {
  drawing = [...drawing, msg.point];
  draw();
});
//socket recieve clear
socket.on("clear", function (msg) {
  drawing = [];
  draw();
});

//timer
const timep = document.getElementById("timer");
const timer = () => {
  if (timep.innerHTML > 0) {
    timep.innerHTML = timep.innerHTML - 1;
  } else {
    clearInterval(timerinterval);
    endDrawingTurn();
    next();
  }
};

const Guesstimer = () => {
  if (timep.innerHTML > 0) {
    timep.innerHTML = timep.innerHTML - 1;
    console.log('acn')
  } else {
    clearInterval(gtimer);
  }
};

//start drawing
function startDrawingTurn(user, word) {
  timep.innerHTML = 60;
  cl();
  document.querySelector(".input-box").style.display = "none";
  alert("You have to draw " + word);
  socket.emit("draw-alert", { message: user.name + " is drawing" });
  timerinterval = setInterval(timer, 1000);
  marker.style.display = "flex";
  colorButtons.style.visibility = "visible";
  window.addEventListener("mousedown", clickT);
  window.addEventListener("mouseup", clickF);
  window.addEventListener("mousemove", setMousePos);
}

function endDrawingTurn() {
  cl();
  clearInterval(timerinterval);
  marker.style.display = "none";
  colorButtons.style.visibility = "hidden";
  window.removeEventListener("mousedown", clickT);
  window.removeEventListener("mousemove", clickF);
  window.removeEventListener("mouseup", setMousePos);
}

function startGuessTurn(user) {
  timep.innerHTML = 60;
  endDrawingTurn();
  document.querySelector(".input-box").style.display = "block";
  guessed = false;
  gtimer = setInterval(Guesstimer, 1000);
}

socket.on("change-turn", (data) => {
  if (data.user.id == id) {
    startDrawingTurn(data.user, data.word);
    document.querySelector("#letters").innerText = data.word;
  } else {
    word = data.word;
    word = String(word);
    var s = " ";
    for (let k = 0; k < word.length; k++) {
      s = s + "__ ";
    }
    document.querySelector("#letters").innerText = s;
    startGuessTurn();
  }
});

const submitGuess = () => {
  var guessword = document.querySelector("#guessInput");
  if (guessword.value == word && !guessed) {
    guessword.value = "";
    guessed = true;
    socket.emit("update-score", { id: id, score: 100 + timep.innerHTML * 5 });
  } else {
    socket.emit("new-message", { name: name, word: guessword.value });
    guessword.value = "";
  }
};

socket.on("update-users", function (data) {
  const usersr = document.querySelectorAll(".user");
  const users = document.querySelector(".users");
  usersr.forEach((element) => {
    element.remove();
  });
  data.users.forEach((element) => {
    var user = document.createElement("div");
    var name = document.createElement("p");
    name.innerText = element.name + "\n" + element.score;
    user.appendChild(name);
    user.classList.add("user");
    users.appendChild(user);
  });
});

socket.on("add-message", function (data) {
  const messages = document.querySelector(".messages-inner");
  var message = document.createElement("div");
  message.classList.add("message");
  message.innerText = data.message;
  messages.appendChild(message);
});

socket.on("add-message-2", function (data) {
  const messages = document.querySelector(".messages-inner");
  var message = document.createElement("div");
  message.classList.add("message");
  message.style.color = "green";
  message.innerText = data.message;
  messages.appendChild(message);
});

socket.on("winner", (msg) => {
  var winnerdiv = document.querySelector(".winner");
  var winnerp = document.querySelector("#winnerp");
  var overlay = document.querySelector(".overlay");
  winnerp.innerText = msg.name + " is the winner with " + msg.score + " points";
  overlay.style.display = "block";
  winnerdiv.style.top = "50%";
});

const close = () => {
  socket.emit("close", "close");
};

socket.on("close", (msg) => {
  window.location = window.location + "thank";
});
