var DATABASE_URL = process.env.DATABASE_URL || "postgres://iejemqeecyepud:BY9bljvPJySAl9DFUnNcXLryAW@ec2-107-20-224-236.compute-1.amazonaws.com:5432/d3h8uu99j81d85"+"?ssl=true"


var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var visitCount = 0;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  pg.connect(DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM note', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/index', {results: result.rows}); }
    });
  });


});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


var pg = require('pg');

app.get('/db', function (request, response) {
  pg.connect(DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM note', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
})

app.get('/allNotes', function(request, response) {
  pg.connect(DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM note', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { /*response.render('pages/db', {results: result.rows} );*/
          response.send(result.rows);
        }
    });
  });
});


app.get('/notes/:channel', function(request, response) {
  console.log("visit count += "+visitCount++);
  console.log("channel = "+request.params.channel);
  pg.connect(DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM note WHERE channel = $1', [request.params.channel], function(err, result) {
      if (err) {
        console.error(err); response.send("Error " + err);
      }
      if (result.rows.length===0)
      {
        client.query('INSERT INTO note (channel, field) VALUES ($1,$2)',
                     [request.params.channel, ""],
                     function(err, result) {
          if (err)
          { console.error(err); response.send("Error " + err); }
          else
          { /*response.render('pages/db', {results: result.rows} );*/
            console.log("successfully inserted");
            response.render('pages/notepad', {results: {"field":"", "channel":request.params.channel}});
          }
        });
      }
      else
      { /*response.render('pages/db', {results: result.rows} );*/
        console.log("loaded existing note");
        response.render('pages/notepad', {results: result.rows[0]});
      }
    });
    done();
  });
});

app.post('/notes', function(request, response) {
  console.log("req.body.channel = "+request.body.channel);
  console.log("req.body.field = "+request.body.field);
  pg.connect(DATABASE_URL, function(err, client, done) {
    console.log("connected");
    client.query("UPDATE note SET field = ($1) WHERE channel = ($2)",
                  [request.body.field, request.body.channel],
                  function(err, result) {
      done();
      if (err) {
        console.error(err); response.send("Error " + err);
      }
      else {
        response.send({"status":"successfully saved"});
      }

    });
  });
});


/////////////////////////////////////////////////////////////////////
// FOR TEST: OAUTH
/////////////////////////////////////////////////////////////////////

var configAuth = require("./auth");
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: configAuth.clientId,
    clientSecret: configAuth.clientSecret,
    callbackURL: configAuth.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
      /*User.findOne({"facebook.id":profile.id}, function(err, user) {
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null, user);
        }
        else {
          var newUser = new User();
          newUser.facebook.id = profile.id;
          newUser.facebook.token = accessToken;
          newUser.facebook.name = profile.name.givenName + " " + profile.name.familyName;
          newUser.facebook.email = profile.emails[0].value;
          // save user to database.
        }
      });*/
      console.log(profile);
    });
  }
));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));
