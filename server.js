const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = process.env.PORT || 3000;
var drawing=[]
var users=[]
var i=0
var rounds=2
var objects=['cat','ball','bat','bowl','bottle','car','fan','wave']
function user(name,id,score){
  this.name=name;
  this.admin=false;
  this.id=id
  this.score=score
}
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/thank', (req, res) => {
  res.sendFile(__dirname + '/thank.html');
});

io.on('connection', (socket) => {
  socket.on('new-user',(msg)=>{
    var User=new user(msg.name,msg.id,0)
    if(users.length==0){
      User.admin=true
    }
    users.push(User)
    socket.broadcast.emit('r-users',{'users':users,'admin':users[0]})
    socket.emit('r-users',{'users':users,'admin':users[0]})
  });

  socket.on('success', (msg) => {
    socket.broadcast.emit('draw',{'point':msg.point})
  });

  socket.on('clear', (msg)=>{
    drawing=[]
    socket.broadcast.emit('clear',{'drawing':drawing})
  });
  
  socket.on('continue',(msg)=>{
    
    if(i<users.length && rounds>0){
      var turn=users[i]
      var word=objects[Math.floor(Math.random()*objects.length)]
      socket.emit('change-turn',{'user':turn,'word':word})
      socket.broadcast.emit('change-turn',{'user':turn,'word':word})
      i++
    }
    else if(rounds>0){
      i=0
      var turn=users[i]
      var word=objects[Math.floor(Math.random()*objects.length)]
      socket.emit('change-turn',{'user':turn,'word':word})
      socket.broadcast.emit('change-turn',{'user':turn,'word':word})
      i++
      rounds--
    }
    else{
      var u=undefined
      var score=0
      users.forEach(element => {
        if(element.score>score){
          u=element
          score=element.score
        }
      });
      socket.emit('winner',u)
      socket.broadcast.emit('winner',u)
    }

  });

  socket.on('update-score',(msg)=>{
    var id=msg.id
    var u=undefined
    users.forEach(user => {
      if(user.id==id){
        user.score+=msg.score
        u=user
      }
    });
    socket.broadcast.emit('update-users',{'users':users,'admin':users[0]})
    socket.emit('update-users',{'users':users,'admin':users[0]})
    socket.emit('add-message-2',{'message':u.name+" has guessed correctly"})
    socket.broadcast.emit('add-message-2',{'message':u.name+" has guessed correctly"})
  });


  socket.on('new-message',(msg)=>{
    socket.emit('add-message',{'message':msg.name+" :  "+msg.word})
    socket.broadcast.emit('add-message',{'message':msg.name+" :  "+msg.word})
  })

  
  socket.on('draw-alert',(msg)=>{
    socket.emit('add-message',{'message':msg.message})
    socket.broadcast.emit('add-message',{'message':msg.message})
  })

  socket.on('reset-game',(msg)=>{
    drawing=[]
    users=[]
    i=0
    socket.broadcast.emit('reset',{'message':'true'})
    socket.emit('reset','true')
  })

  socket.on('user-exit',(data)=>{
    for(let j=0;j<users.length;j++){
      if(users[j].id==data.id){
        users.pop(j)
        break
      }
      console.log('abc')
      socket.broadcast.emit('update-users',{'users':users,'admin':users[0]})
      socket.emit('update-users',{'users':users,'admin':users[0]})
    }
  })

  socket.on('close',(msg)=>{
    users=[]
    i=0
    drawing=[]
    socket.emit('close','close')
    socket.broadcast.emit('close','close')
  })
});

server.listen(port, () => {
  console.log('listening on *:3000');
});