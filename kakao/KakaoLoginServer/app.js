'use strict';

// import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');

// Firebase setup
const firebaseAdmin = require('firebase-admin');
// you should manually put your service-account.json in the same folder app.js
// is located at.
const serviceAccount = require('./service-account.json');

// Kakao API request url to retrieve user profile based on access token
const requestMeUrl = 'https://kapi.kakao.com/v1/user/me?secure_resource=true';
const accessTokenInfoUrl = 'https://kapi.kakao.com/v1/user/access_token_info';

const config = require('./config.json'); // put your kakao app id in config.json

// Initialize FirebaseApp with service-account.json
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});


/**
 * requestMe - Returns user profile from Kakao API
 *
 * @param  {String} kakaoAccessToken Access token retrieved by Kakao Login API
 * @return {Promise<Response>}      User profile response in a promise
 */
function requestMe(kakaoAccessToken) {
  console.log('Requesting user profile from Kakao API server.');
  return request({
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + kakaoAccessToken},
    url: requestMeUrl,
  });
}

/**
 * validateToken - Returns access token info from Kakao API,
 * which checks if this token is issued by this application.
 *
 * @param {String} kakaoAccessToken Access token retrieved by Kakao Login API
 * @return {Promise<Response>}      Access token info response
 */
function validateToken(kakaoAccessToken) {
  console.log('Validating access token from Kakao API server.');
  return request({
      method: 'GET',
      headers: {'Authorization': 'Bearer ' + kakaoAccessToken},
      url: accessTokenInfoUrl,
  });
}


/**
 * updateOrCreateUser - Update Firebase user with the give email, or create if
 * none exists.
 *
 * @param  {String} userId        user id per app
 * @param  {String} email         user's email address
 * @param  {String} displayName   user
 * @param  {String} photoURL      profile photo url
 * @return {Promise<UserRecord>} Firebase user record in a promise
 */
function updateOrCreateUser(userId, email, displayName, photoURL) {
  console.log(`fetching a firebase user by email ${email}`);
  return firebaseAdmin.auth().getUserByEmail(email)
    .then((userRecord) => linkUserWithKakao(userId, userRecord))
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        const params = {
          uid: `kakao:${userId}`,
          displayName: displayName,
        };
        if (email) {
          params['email'] = email;
        }
        if (photoURL) {
          params['photoURL'] = photoURL;
        }
        console.log(`creating a firebase user with email ${email}`);
        return firebaseAdmin.auth().createUser(params);
      }
      throw error;
    });
}

/**
 * linkUserWithKakao - Link current user record with kakao app user id.
 *
 * @param {String} userId
 * @param {admin.auth.UserRecord} userRecord
 * @return {Promise<UserRecord>}
 */
function linkUserWithKakao(userId, userRecord) {
  console.log(`linking user with kakao provider with app user id ${userId}...`);
  return firebaseAdmin.auth()
    .setCustomUserClaims(userRecord.uid,
      {kakaoUID: userId}).then((Void) => Promise.resolve(userRecord));
}

/**
 * createFirebaseToken - returns Firebase token using Firebase Admin SDK
 *
 * @param  {String} kakaoAccessToken access token from Kakao Login API
 * @return {Promise<String>}                  Firebase token in a promise
 */
function createFirebaseToken(kakaoAccessToken) {
  return validateToken(kakaoAccessToken).then((response) => {
      const body = JSON.parse(response);
      const appId = body.appId;
      if (appId !== config.kakao.appId) {
        throw new Error('The given token does not belong to this application.');
      }
      return requestMe(kakaoAccessToken);
  }).then((response) => {
    const body = JSON.parse(response);
    console.log(body);
    const userId = body.id;
    if (!userId) {
      throw new Error('There was no user with the given access token.');
    }
    let nickname = null;
    let profileImage = null;
    if (body.properties) {
      nickname = body.properties.nickname;
      profileImage = body.properties.profile_image;
    }
    return updateOrCreateUser(userId, body.kaccount_email, nickname,
      profileImage);
  }).then((userRecord) => {
    const userId = userRecord.uid;
    console.log(`creating a custom firebase token based on uid ${userId}`);
    return firebaseAdmin.auth().createCustomToken(userId, {provider: 'KAKAO'});
  });
}


// create an express app and use json body parser
const app = express();
app.use(bodyParser.json());


// default root url to test if the server is up
app.get('/', (req, res) => res.status(200)
.send('KakaoLoginServer for Firebase is up and running!'));

// actual endpoint that creates a firebase token with Kakao access token
app.post('/verifyToken', (req, res) => {
  const token = req.body.token;
  if (!token) return res.status(400).send({error: 'There is no token.'})
  .send({message: 'Access token is a required parameter.'});

  console.log(`Verifying Kakao token: ${token}`);

  createFirebaseToken(token).then((firebaseToken) => {
    console.log(`Returning firebase token to user: ${firebaseToken}`);
    res.send({firebase_token: firebaseToken});
  }).catch((error) => res.status(401).send({message: error}));
});

// Start the server
const server = app.listen(process.env.PORT || '8000', () => {
  console.log('KakaoLoginServer for Firebase listening on port %s',
  server.address().port);
});
