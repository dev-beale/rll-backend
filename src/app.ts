import express from 'express';
import {closeConnection} from './db.ts'
var cors = require('cors')

import {rllPassport} from './authentication.ts'
import {endpoints} from './endpoints.ts'
import { streamingRouter } from './streaming.ts';

const session = require('express-session')
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true 
}))
app.use(rllPassport.initialize())
app.use(rllPassport.session())

app.use(cors());

const expressWs = require('express-ws')(app);
app.use('/ws', streamingRouter);
app.use('/', endpoints);


const port = 3000;

app.use(express.static(__dirname + '/dist/rll-frontend'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/dist/rll-frontend/index.html')
})

// Handle app termination
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing MySQL connection');
  closeConnection();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing MySQL connection');
  closeConnection();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  closeConnection();
  process.exit(1); // exit with a 'failure' code
});

let WSServer = require('ws').Server;
let server = require('http').createServer();

// Create web socket server on top of a regular http server
let wss = new WSServer({

  server: server
});

// Also mount the app here
server.on('request', app);

wss.on('connection', function connection(ws : any) {
 
  ws.on('message', function incoming(message : any) {
    
    console.log(`received: ${message}`);
    
    ws.send(JSON.stringify({

      answer: 42
    }));
  });
});


server.listen(3000, function() {

  console.log(`http/ws server listening on ${3000}`);
});
