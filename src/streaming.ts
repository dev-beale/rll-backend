import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import { Router } from "express";

export const streamingRouter = Router();
const expressWs = require('express-ws')(streamingRouter);
streamingRouter.ws('/echo', (ws, req) => {
    ws.on('connection', function (socket) {
      console.log('connected socket');
    })
    ws.on('message', (message) => {
      ws.send(message);
    });
});
