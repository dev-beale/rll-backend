import passport from 'passport';
import {con} from './db.ts'
var LocalStrategy = require('passport-local').Strategy;

function findUserByUsername(username : string, cb :any) {
    con.query(`SELECT * FROM users where username='${username}'`, function (err: any, result: any, fields: any) {
      if (err) throw err;
      cb(result[0])
    });
  }
  
  function findUserById(id : any, cb :any) {
    con.query(`SELECT * FROM users where id='${id}'`, function (err: any, result: any, fields: any) {
      if (err) throw err;
      cb(result[0])
    });
  }

passport.use(new LocalStrategy((username : any, password :any, done : any) => {
    findUserByUsername(username, (user : any) => {
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (user.plaintext_password !== password) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);      
  });
}));

passport.serializeUser((user : any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  findUserById(id, (user : any) => {
    done(null, user)
  })
});

export {passport as rllPassport}