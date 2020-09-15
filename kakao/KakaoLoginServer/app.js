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
 * createOrLinkUser - Link firebase user with given email,
 * or create one if none exists. If email is not given,
 * create a new user since there is no other way to map users.
 * If email is not verified, make the user re-authenticate with other means.
 *
 * @param  {String} kakaoUserId    user id per app
 * @param  {String} email          user's email address
 * @param  {Boolean} emailVerified whether this email is verified or not
 * @param  {String} displayName    user
 * @param  {String} photoURL       profile photo url
 * @return {Promise<UserRecord>}   Firebase user record in a promise
 */
function createOrLinkUser(kakaoUserId, email, emailVerified, displayName,
                            photoURL) {
  return getUser(kakaoUserId, email, emailVerified)
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        const params = {
          uid: `kakao:${kakaoUserId}`,
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
    })
    .then((userRecord) => linkUserWithKakao(kakaoUserId, userRecord));
}

/**
 * getUser - fetch firebase user with kakao UID first, then with email if
 * no user found. If email is not verified, throw an error so that
 * the user can re-authenticate.
 *
 * @param {String} kakaoUserId    user id per app
 * @param {String} email          user's email address
 * @param {Boolean} emailVerified whether this email is verified or not
 * @return {Promise<admin.auth.UserRecord>}
 */
function getUser(kakaoUserId, email, emailVerified) {
  console.log(`fetching a firebase user with uid kakao:${kakaoUserId}`);
  return firebaseAdmin.auth().getUser(`kakao:${kakaoUserId}`)
    .catch((error) => {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      if (!email) {
        throw error; // cannot find existing accounts since there is no email.
      }
      console.log(`fetching a firebase user with email ${email}`);
      return firebaseAdmin.auth().getUserByEmail(email)
        .then((userRecord) => {
          if (!emailVerified) {
            throw new Error('This user should authenticate first ' +
              'with other providers');
          }
          return userRecord;
        });
    });
}

/**
 * linkUserWithKakao - Link current user record with kakao UID
 * if not linked yet.
 *
 * @param {String} kakaoUserId
 * @param {admin.auth.UserRecord} userRecord
 * @return {Promise<UserRecord>}
 */
function linkUserWithKakao(kakaoUserId, userRecord) {
  if (userRecord.customClaims &&
    userRecord.customClaims['kakaoUID'] === kakaoUserId) {
    console.log(`currently linked with kakao UID ${kakaoUserId}...`);
    return Promise.resolve(userRecord);
  }
  console.log(`linking user with kakao UID ${kakaoUserId}...`);
  return firebaseAdmin.auth()
    .setCustomUserClaims(userRecord.uid,
      {kakaoUID: kakaoUserId}).then(() => userRecord);
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
    return createOrLinkUser(userId, body.kaccount_email,
      body.kaccount_email_verified, nickname, profileImage);
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
