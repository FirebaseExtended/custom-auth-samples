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
const rp = require('request-promise');
const express = require('express');
const bodyParser = require('body-parser');

// Firebase Setup
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Load config file
const config = require('./config.json');

  // Generate a Request option to access LINE APIs
  function generateLineApiRequest(apiEndpoint, lineAccessToken) {
    return {
        method: 'GET',
      url: `${apiEndpoint}?access_token=${lineAccessToken}`,
      json: true
    };
  }

  function lineProfileRequest(apiEndpoint, lineAccessToken) {
      return {
          method: 'GET',
          url: `${apiEndpoint}`,
          headers: {'Authorization': `Bearer ${lineAccessToken}`},
          json: true
      }
  }

/**
 * Look up Firebase user based on LINE's mid. If the Firebase user does not exist,
 + fetch LINE profile and create a new Firebase user with it.
 *
 * @returns {Promise<UserRecord>} The Firebase user record in a promise.
 */
function getFirebaseUser(lineAccessToken) {
const getProfileOptions = lineProfileRequest('https://api.line.me/v2/profile', lineAccessToken);
    console.log(getProfileOptions)
    return request(getProfileOptions).then(response => {
        const displayName = response.displayName;
        const firebaseUid = `line:${response.userId}`;
        return firebaseAdmin.auth().getUser(firebaseUid).catch(err => {
            if (err.code === 'auth/user-not-found') {
                return firebaseAdmin.auth().createUser({
                    provider: 'LINE',
                    uid: firebaseUid,
                    displayName: displayName
                })
            }
            throw err
        })
    })
}

/**
 * Verify LINE access token and return a custom auth token allowing signing-in 
 * the corresponding Firebase account.
 *
 * Here are the steps involved:
 *  1. Verify with LINE server that a LINE access token is valid
 *  2. Check if a Firebase user corresponding to the LINE user already existed.
 *  If not, fetch user profile from LINE and generate a corresponding Firebase user.
 *  3. Return a custom auth token allowing signing-in the Firebase account.
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
function verifyLineToken(lineAccessToken) {
  // Send request to LINE server for access token verification
  const verifyTokenOptions = generateLineApiRequest('https://api.line.me/oauth2/v2.1/verify', lineAccessToken);
  var firebaseUid = '';

  // STEP 1: Verify with LINE server that a LINE access token is valid
  return rp(verifyTokenOptions)
    .then(response => {
      // Verify the token’s channelId match with my channelId to prevent spoof attack
      // <IMPORTANT> As LINE's Get user profiles API response doesn't include channelID,
      // you must not skip this step to make sure that the LINE access token is indeed
      // issued for your channel.
      //TODO: consider !== here
      if (response.client_id != config.line.channelId)
        return Promise.reject(new Error('LINE channel ID mismatched'));

      // STEP 2: Access token validation succeeded, so look up the corresponding Firebase user
      return getFirebaseUser(lineAccessToken);
    })
    .then(userRecord => {
      // STEP 3: Generate Firebase Custom Auth Token
      const tokenPromise = admin.auth().createCustomToken(userRecord.uid,{provider: 'LINE'});
      tokenPromise.then(token => {
        console.log('Created Custom token for UID "', userRecord.uid, '" Token:', token);
      });
      
      return tokenPromise;
    });
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

  // Verify LINE access token with LINE server then generate Firebase Custom Auth token
  verifyLineToken(reqToken)
    .then(customAuthToken => {
      const ret = {
        firebase_token: customAuthToken
      };
      return res.status(200).send(ret);   
    })
    .catch(err => {
      // If LINE access token verification failed, return error response to client
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
