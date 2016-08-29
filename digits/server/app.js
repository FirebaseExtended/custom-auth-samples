/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for t`he specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Modules imports
const express = require('express');
const url = require('url');
const request = require('request');
const authorization = require('auth-header');
const firebase = require('firebase');

// Load config file
const config = require('./config.json');

// Firebase Setup
const serviceAccount = require('./service-account.json');
firebase.initializeApp({
  serviceAccount: serviceAccount
});

console.log('Using Firebase DB', `https://${serviceAccount.project_id}.firebaseio.com`);

// ExpressJS setup
const app = express();
app.use(express.static('public'));

app.post('/digits', function (req, res) {
  const apiUrl = req.get('X-Auth-Service-Provider');
  const credentials = req.get('X-Verify-Credentials-Authorization');
  const auth = authorization.parse(credentials);

  // Check the authentication scheme.
  if (auth.scheme !== 'OAuth') {
    return res.status(400).send('Invalid auth type.');
  }

  // Verify the OAuth consumer key.
  if (auth.params.oauth_consumer_key !== config.digits.consumerKey) {
    return res.status(400).send('The Digits API key does not match.');
  }

  // Verify the hostname.
  const hostname = url.parse(apiUrl).hostname;
  if (hostname !== 'api.digits.com' && hostname !== 'api.twitter.com') {
    return res.status(400).send('Invalid API hostname.');
  }

  // Prepare the request to the Digits API.
  const options = {
    url: apiUrl,
    headers: {'Authorization': credentials},
    json: true
  };

  // Perform the request to the Digits API.
  request.get(options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      // Create the custom auth token, update the account and send the token in the response.
      const firebaseAccount = createFirebaseToken(body.id_str);
      return updateAccount(firebaseAccount.token, firebaseAccount.uid,
                           body.email_address.address, body.phone_number)
          .then(() => res.send(firebaseAccount.token));
    }
    // Send the error.
    return res.status(500).send(error.message);
  });
});

/**
 * Creates a Firebase custom auth token for the given Digits user ID.
 *
 * @returns {Object} The Firebase custom auth token and the uid.
 */
function createFirebaseToken(digitsUID) {
  // The UID we'll assign to the user.
  const uid = `digits:${digitsUID}`;

  // Create the custom token.
  const token = firebase.app().auth().createCustomToken(uid);
  console.log('Created Custom token for UID "', uid, '" Token:', token);
  return {token: token, uid: uid};
}

/**
 * Updates the user with the given email and phoneNumber. Updates the Firebase user profile
 * with the email if needed and saves the phone Number in the realtime database
 *
 * @returns {Promise} Promise that completes when all the updates have been completed.
 */
function updateAccount(token, uid, email, phoneNumber) {
  // Create a Firebase app we'll use to authenticate as the user.
  const userApp = firebase.initializeApp({
    apiKey: config.firebase.apiKey,
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  }, uid);

  // Authenticate as the user, updates the email and save phone number.
  return userApp.auth().signInWithCustomToken(token).then(user => {

    // Saving Phone number in Realtime Database.
    console.log('Saving Phone number', phoneNumber, 'to', `/phoneNumbers/${uid}`);
    const tasks = [userApp.database().ref(`/phoneNumbers/${uid}`).set(phoneNumber)];

    // Updating the email of the Firebase user if different.
    if (email !== user.email) {
      console.log('Updating email of user', uid, 'with', email);
      tasks.push(user.updateEmail(email));
    }

    // Wait for completion of above tasks, free up the Firebase app and return the token.
    return Promise.all(tasks)
        .then(() => userApp.delete());
  }).catch(e => {
    userApp.delete();
    throw e;
  });
}

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
