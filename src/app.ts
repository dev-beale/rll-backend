import express from 'express';
import {closeConnection} from './db.ts'
var cors = require('cors')

import {rllPassport} from './authentication.ts'
import {endpoints} from './endpoints.ts'
import { streamingRouter } from './streaming.ts';
import { StartStreamTranscriptionCommand, StartStreamTranscriptionResponse, TranscribeStreamingClient, TranscriptEvent } from '@aws-sdk/client-transcribe-streaming';

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

const { PassThrough } = require('stream');

// Also mount the app here
server.on('request', app);

wss.on('connection', function connection(ws : any) {
  const memoryStream = new PassThrough();
  
  const audioSource = memoryStream; //Incoming message
  
  const audioStream = async function* () {
    for await (const payloadChunk of audioSource) {
      yield { AudioEvent: { AudioChunk: payloadChunk } };
    }
  };

  const command = new StartStreamTranscriptionCommand({
    // The language code for the input audio. Valid values include en-GB, en-US, es-US, fr-CA, and fr-FR
    LanguageCode: "ru-RU",
    // The encoding used for the input audio. The only valid value is pcm.
    MediaEncoding: "pcm",
    // The sample rate of the input audio in Hertz. We suggest that you use 8000 Hz for low-quality audio and 16000 Hz for
    // high-quality audio. The sample rate must match the sample rate in the audio file.
    MediaSampleRateHertz: 48000,
    AudioStream: audioStream(),
  });

  const client = new TranscribeStreamingClient({
    region : 'us-east-1'
  });

  client.send(command).then(async (response :StartStreamTranscriptionResponse ) => {
    if(!response.TranscriptResultStream){
      throw Error('StartStreamTranscriptionResponse returned no stream');
    }
    for await (const event of response.TranscriptResultStream) {
      if (event.TranscriptEvent) {
        const message : TranscriptEvent = event.TranscriptEvent;
        // Get multiple possible results
        const results = message?.Transcript?.Results;
        // Print all the possible transcripts
        if(!results){
          throw Error('No results');
        }
        results.map((result) => {
          (result.Alternatives || []).map((alternative) => {
            if(!alternative || !alternative.Items){
              throw Error('No alternative or alternative.Items');
            }
            const transcript = alternative.Items.map((item) => item.Content).join(" ");
            console.log(transcript);
          });
        });
      }
    }
  });

  ws.on('message', function incoming(message : any) {
    memoryStream.write(message);
    console.log(`received: ${message}`);
    
    ws.send(message);
  });
});


server.listen(3000, function() {

  console.log(`http/ws server listening on ${3000}`);
});
