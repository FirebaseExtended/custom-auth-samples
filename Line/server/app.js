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

// Modules imports
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');

// Firebase Setup
const firebase = require('firebase');
firebase.initializeApp({
  serviceAccount: 'service-account.json'
});

// Load config file
const config = require('./config.json');

// Generate Firebase Custom Auth token
function generateFirebaseToken(lineMid) {
  // The UID we'll assign to the user.
  const firebaseUid = `line:${lineMid}`;

  // Create the custom token.
  const token = firebase.auth().createCustomToken(firebaseUid);
  console.log('Created Custom token for UID "', firebaseUid, '" Token:', token);
  return token;
}

// ExpressJS setup
const app = express();
app.use(bodyParser.json());

// Verify LINE token and exchange for Firebase Custom Auth token
app.post('/verifyToken', (req, res) => {
  if (req.body.token === undefined) {
    const ret = {
      error_message: 'Access Token not found'
    };
    return res.status(400).send(ret);
  }

  const reqToken = req.body.token;

  // Send request to LINE server for access token verification
  const options = {
    url: 'https://api.line.me/v1/oauth/verify',
    headers: {
      'Authorization': `Bearer ${reqToken}`
    }
  };
  request(options, (error, response, body) => {
    console.log(body);
    if (!error && response.statusCode == 200) {
      const lineObj = JSON.parse(body);

      // Verify the token’s channelId match with my channelId to prevent spoof attack
      if ((typeof lineObj.mid !== 'undefined') && (lineObj.channelId == config.line.channelId)) {
        // Access Token Validation succeed with LINE server
        // Generate Firebase token and return to device
        const firebaseToken = generateFirebaseToken(lineObj.mid);
        const ret = {
          firebase_token: firebaseToken
        };
        return res.status(200).send(ret);    
      }
    }
      
    const ret = {
      error_message: 'Authentication error: Cannot verify access token.'
    };
    return res.status(403).send(ret);
  });

});

// Endpoint to verify if your Node server is up
app.get('/', (req, res) => {
  return res.status(200).send('Server is up and running!');
});

// Start the server
const server = app.listen(process.env.PORT || '8080', () => {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
