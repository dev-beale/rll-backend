import mysql from 'mysql';

export var con : mysql.Connection = mysql.createConnection({
    host: "database-1.cpyqy8g6y0se.us-east-1.rds.amazonaws.com", // usually 'localhost' or an IP address
    user: "admin",
    password: "1qaz!QAZ",
    database: "RLL_DATABASE"
});

con.connect(function(err: any) {
    if (err) {
      console.error(err);
    }
    console.log("Connected!");
});

export function closeConnection() {
    con.end(function(err:any) {
    if (err) {
      console.error('Error during disconnection', err.stack);
    }
    console.log('Database connection closed.');
    });
  }