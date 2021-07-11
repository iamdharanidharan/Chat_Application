'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.set('view engine', 'pug');

myDB(async (client) => {
  const myDataBase = await client.db('ChatApp_FCC').collection('users');

  app.route('/').get((req, res) => {
    res.render(process.cwd()+'/views/pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin : true
    });
  });

  app.route('/login').post(passport.authenticate('local',{ failureRedirect: '/' }),(req,res)=>{
      res.redirect('/');
  });

  app.route('/profile').get((req,res)=>{
    res.render(process.cwd()+'/views/pug/profile');
  })

  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (password !== user.password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  // Serialization and deserialization
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render(process.cwd()+'/views/pug', { title: e, message: 'Unable to login' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});