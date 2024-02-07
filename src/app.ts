import express from 'express';
const mysql = require('mysql');
var cors = require('cors')


var con = mysql.createConnection({
    host: "database-1.cpyqy8g6y0se.us-east-1.rds.amazonaws.com", // usually 'localhost' or an IP address
    user: "admin",
    password: "1qaz!QAZ",
    database: "RLL_DATABASE"
  });
con.connect(function(err: any) {
  if (err) throw err;
    console.log("Connected!");
  });

function closeConnection() {
    con.end(function(err:any) {
    if (err) {
      console.error('Error during disconnection', err.stack);
    }
    console.log('Database connection closed.');
    });
  }

const app = express();
app.use(cors());
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/russian_english', (req, res) => {
    con.query("SELECT * FROM russian_english", function (err: any, result: any, fields: any) {
      if (err) throw err;
      res.send(result);
  });
});

app.get('/russian_english/stats', (req, res) => {
    con.query(`SELECT * FROM word_usage_stats`, function (err: any, result: any, fields: any) {
      if (err) throw err;
      res.send(result);
  });
});

app.get('/russian_english/:id/stats', (req, res) => {
  const wordId = req.params.id;
    con.query(`SELECT * FROM word_usage_stats where russian_english_id=${wordId}`, function (err: any, result: any, fields: any) {
      if (err) throw err;
      res.send(result);
  });
});

app.post('/russian_english/:id/correct', (req, res) => {
  const wordId = req.params.id;
    con.query(`SELECT * FROM word_usage_stats where russian_english_id=${wordId}`, function (err: any, result: any, fields: any) {
      if (err) throw err;
      if(result.length == 0){
        con.query(`INSERT INTO word_usage_stats (russian_english_id, presented, recalled) VALUES (${wordId}, 1, 1)`, 
          function (err: any, result: any, fields: any) {
            res.send("word_usage_stats entry created");
          });
      } else{
        con.query(`UPDATE word_usage_stats SET presented = presented + 1, recalled = recalled + 1 WHERE russian_english_id = ${wordId};`, function (err: any, result: any, fields: any) {
          res.send("word_usage_stats entry updated");
        })
      }
  });
});

app.post('/russian_english/:id/wrong', (req, res) => {
  const wordId = req.params.id;
    con.query(`SELECT * FROM word_usage_stats where russian_english_id=${wordId}`, function (err: any, result: any, fields: any) {
      if (err) throw err;
      if(result.length == 0){
        con.query(`INSERT INTO word_usage_stats (russian_english_id, presented, recalled) VALUES (${wordId}, 1, 0)`, 
          function (err: any, result: any, fields: any) {
            res.send("word_usage_stats entry created");
          });
      } else{
        con.query(`UPDATE word_usage_stats SET presented = presented + 1 WHERE russian_english_id = ${wordId};`, function (err: any, result: any, fields: any) {
          res.send("word_usage_stats entry updated");
        })
      }
  });
});


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
