import express from 'express';
import {closeConnection, con} from './db.ts'
var cors = require('cors')

import {rllPassport} from './authentication.ts'
import {endpoints} from './endpoints.ts'

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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
