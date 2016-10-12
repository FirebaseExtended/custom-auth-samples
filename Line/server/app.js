// Copyright 2015-2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
'use strict';

var firebase = require('firebase');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

/*** Configuration BEGIN ***/
var MY_LINE_CHANNEL_ID = '<your_channel_id>';
var MY_FIREBASE_API_KEY = '<your_firebase_api_key>';
/*** Configuration END ***/

//Generate Firebase Custom Auth token
function generateFirebaseToken(lineMid) {
  var firebaseUid = 'line:' + lineMid;
  var additionalClaims = {
    provider: 'LINE'
  };
  return firebase.auth().createCustomToken(firebaseUid);
}

function updateUserProfile(lineAccessToken, firebaseToken, mid, callback) {

  var options = {
    url: 'https://api.line.me/v1/profile',
    headers: {
      'Authorization': 'Bearer ' + lineAccessToken
    }
  };

  request(options, function(error, response, body) {
    if (!error) {
      var lineObj = JSON.parse(body);

      console.log(lineObj);

      // Create a Firebase app we'll use to authenticate as the user.
      var fbAppID = (new Date).getTime() + ":" + mid; //An unique ID for Firebase user app
      const userApp = firebase.initializeApp({
        apiKey: MY_FIREBASE_API_KEY,
      }, fbAppID);

      // Authenticate as the user.
      userApp.auth().signInWithCustomToken(firebaseToken).then(user => {
        console.log(user.displayName);

        if (user.displayName == null) {
          user.updateProfile({
            displayName: lineObj.displayName,
            photoURL: lineObj.pictureUrl
          });
        }

        return Promise.all(tasks)
          .then(() => {
            userApp.delete();
            callback();
          });
      }).catch(() => {
        userApp.delete();
        callback();
      });
    } else {
      console.log('Error fetching LINE profile for mid = ', mid);
      callback();
    }
  });

}

firebase.initializeApp({
  serviceAccount: 'service-account.json'
});

var app = express();
app.use(bodyParser.json());

// Verify LINE token and exchange for Firebase Custom Auth token
app.post('/verifyToken', function(req, res) {
  if (req.body.token === undefined) {
    res.status(400).send('Access Token not found');
  } else {
    var reqToken = req.body.token;
    // console.log('LINE Access Token = ' + reqToken);

    // Send request to LINE server for access token verification
    var options = {
      url: 'https://api.line.me/v1/oauth/verify',
      headers: {
        'Authorization': 'Bearer ' + reqToken
      }
    };
    request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        // console.log(body);
        var lineObj = JSON.parse(body);

        if ((typeof lineObj.mid != 'undefined') && (lineObj.channelId == MY_LINE_CHANNEL_ID)) {
          // Access Token Validation succeed with LINE server
          // Generate Firebase token and return to device
          var firebaseToken = generateFirebaseToken(lineObj.mid);

          // Update Firebase user profile with LINE profile
          updateUserProfile(reqToken, firebaseToken, lineObj.mid, function() {
            var ret = {
              firebase_token: firebaseToken
            };
            return res.status(200).send(ret);
          });
        }
      } else {
        var ret = {
          error_message: 'Authentication error: Cannot verify access token.'
        };
        return res.status(403).send(ret);
      }
    });

  }
});

// Endpoint to verify if your Node server is up
app.get('/', function(req, res) {
  return res.status(200).send('Server is up and running!');
});

// Start the server
var server = app.listen(process.env.PORT || '8080', function() {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]