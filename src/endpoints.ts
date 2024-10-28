import { Router } from "express";
import {con } from "./db";
import { rllPassport } from "./authentication";
import { postToOpenAI } from "./open-ai";

import multer from "multer";
import { uploadToS3 } from "./aws-s3";
import { S3UploadResult, TranscriptionJobResult } from "./interfaces";
import { submitTranscriptionJob } from "./aws-transcribe";

const upload = multer({
  dest: './uploads/', // storage directory
  limits: { fileSize: 100000000 }, // 1MB file size limit
  fileFilter: (req, file, cb) => {
      return cb(null, true);
  }
});

const endpointsRouter = Router();

endpointsRouter.post('/login', rllPassport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: false
  })
)

endpointsRouter.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
      res.send(`Hello \${req.user.username}, welcome to your dashboard!`);
  } else {
      res.redirect('/login');
  }
});

endpointsRouter.get('/login', (req, res) => {
  res.send('<form action="/login" method="POST"><input type="text" name="username"/><input type="password" name="password"/><button type="submit">Login</button></form>');
});

endpointsRouter.get('/helloworld', (req, res) => {
  res.send('Hello World!');
});

endpointsRouter.get('/testopenai', async (req, res) => {
  try {
    const response = await postToOpenAI("Hello, ChatGPT!");
    res.send(response?.data);
  } catch (error) {
    res.send(error);
  }
});

endpointsRouter.get('/russian_english', (req, res) => {
    con.query("SELECT * FROM russian_english", function (err: any, result: any, fields: any) {
      if (err) throw err;
      res.send(result);
  });
});

endpointsRouter.get('/russian_english/stats', (req, res) => {
    console.log(req.query)
    const wordId = req.query.wordId;
    const userId = req.query.userId;
    const query = `SELECT * FROM word_usage_stats where russian_english_id=${wordId} and user_id=${userId};`
    console.log(query)
    con.query(query, function (err: any, result: any, fields: any) {
      if (err) throw err;
      res.send(result);
  });
});

endpointsRouter.post('/russian_english/correct', (req, res) => {
  const wordId = req.body.wordId;
  const userId = req.body.userId;
    con.query(`SELECT * FROM word_usage_stats where russian_english_id=${wordId} and user_id=${userId};`, function (err: any, result: any, fields: any) {
      if (err) throw err;
      if(result.length == 0){
        con.query(`INSERT INTO word_usage_stats (russian_english_id, presented, recalled, user_id) VALUES (${wordId}, 1, 1, ${userId})`, 
          function (err: any, result: any, fields: any) {
            res.send("word_usage_stats entry created");
          });
      } else{
        con.query(`UPDATE word_usage_stats SET presented = presented + 1, recalled = recalled + 1 WHERE russian_english_id = ${wordId} and user_id=${userId};`, function (err: any, result: any, fields: any) {
          res.send("word_usage_stats entry updated");
        })
      }
  });
});

endpointsRouter.post('/russian_english/wrong', (req, res) => {
  const wordId = req.body.wordId;
  const userId = req.body.userId;
    con.query(`SELECT * FROM word_usage_stats where russian_english_id=${wordId} and user_id=${userId};`, function (err: any, result: any, fields: any) {
      if (err) throw err;
      if(result.length == 0){
        con.query(`INSERT INTO word_usage_stats (russian_english_id, presented, recalled, user_id) VALUES (${wordId}, 1, 0, ${userId})`, 
          function (err: any, result: any, fields: any) {
            res.send("word_usage_stats entry created");
          });
      } else{
        con.query(`UPDATE word_usage_stats SET presented = presented + 1 WHERE russian_english_id = ${wordId} and user_id=${userId};`, function (err: any, result: any, fields: any) {
          res.send("word_usage_stats entry updated");
        })
      }
  });
});

endpointsRouter.get('/getLeastRecalledWord',(req, res) => {
    con.query(`SELECT russian_english_id, presented, recalled, (cast (recalled as float )/presented) as pctRecalled FROM word_usage_stats order by pctRecalled asc`, function (err: any, result: any, fields: any) {
      console.log(result)
      if (err) throw err;
      res.send(result[0]);
    });
});

endpointsRouter.get('/getFiveOfLeastRecalledWords',(req, res) => {
  const userId = req.query.userId;
  con.query(`SELECT 
    russian_english.russian,
    word_usage_stats.russian_english_id, 
    word_usage_stats.presented, 
    word_usage_stats.recalled, 
    word_usage_stats.user_id,
    (cast (word_usage_stats.recalled as float )/word_usage_stats.presented) as pctRecalled 
    FROM word_usage_stats INNER JOIN russian_english on russian_english.id=word_usage_stats.russian_english_id 
    where word_usage_stats.user_id = ${userId}
    order by pctRecalled asc LIMIT 5`, function (err: any, result: any, fields: any) {
    console.log(result)
    if (err) throw err;
    res.send(result);
  });
});

endpointsRouter.post('/startConversationWithFiveLeastRecalledWords', async (req, res) => {
  const userId = req.body.userId;
  con.query(`SELECT 
    russian_english.russian,
    word_usage_stats.russian_english_id, 
    word_usage_stats.presented, 
    word_usage_stats.recalled, 
    
    (cast (word_usage_stats.recalled as float )/word_usage_stats.presented) as pctRecalled 
    FROM word_usage_stats INNER JOIN russian_english on 
    russian_english.id=word_usage_stats.russian_english_id 
    where word_usage_stats.user_id = ${userId} 
    order by pctRecalled asc LIMIT 5`, 
    async function (err: any, result: any, fields: any) {
      if(err){
        res.send(err);
      }

      const russianWords : string = (result.map((x :any) => x['russian'])).join(', ')
      const message : string = "Hi, I'm learning Russian." + 
          "Let's have a brief and simple conversation in Russian emphasizing the following words (If no words are presented, choose five Russian words on your own to emphasize): " + 
          russianWords;

      try {
        const response = await postToOpenAI(message);
        res.send(response?.data);
      } catch (error) {
        res.send(error);
      }
    });
});

endpointsRouter.post('/continueConversation', async (req, res) => {
    let postBody = req.body;
    console.log(postBody)
    const message : string = "Continue the conversation in Russian based off of this conversation history: " + postBody['conversationHistory'];
    console.log(message)
    
    try {
      const response = await postToOpenAI(message);
      res.send(response?.data);
    } catch (error) {
      res.send(error);
    }
});

endpointsRouter.post('/upload', upload.single('file'), async (req, res) => {
    // Handle uploaded file
    console.log(`File uploaded: ${req.file?.originalname}`);
    console.log(req.file?.size);
    if(req.file?.filename){
      try {
        const s3UploadResult : S3UploadResult = await uploadToS3('./uploads/' + req.file.filename);
        if(!s3UploadResult.success){
          throw Error("S3 Upload Failed");
        }
        const transcriptionJobResult : TranscriptionJobResult = await submitTranscriptionJob(s3UploadResult.dataLocation);
        if(!transcriptionJobResult.success){
          throw Error("Transcribe Job Failed")
        }
        res.send(`Transcription job submitted successfully: ${JSON.stringify(transcriptionJobResult)}`);
      } catch(error) {
        res.send(`File upload failed: ${error}`)
      }
    }
});

export {endpointsRouter as endpoints}