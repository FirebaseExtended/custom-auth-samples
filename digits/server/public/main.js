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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes the Demo.
function Demo() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    this.signInButton = $('#demo-sign-in-button');
    this.signOutButton = $('#demo-sign-out-button');
    this.deleteButton = $('#demo-delete-button');
    this.emailContainer = $('#demo-email-container');
    this.uidContainer = $('#demo-uid-container');
    this.phoneContainer = $('#demo-phone-container');
    this.signedOutCard = $('#demo-signed-out-card');
    this.signedInCard = $('#demo-signed-in-card');

    // Bind events.
    this.signInButton.click(this.onSignInButtonClick.bind(this));
    this.signOutButton.click(this.onSignOutButtonClick.bind(this));
    this.deleteButton.click(this.onDeleteAccountButtonClick.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
  }.bind(this));
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function(user) {
  if (user) {
    this.emailContainer.text(user.email);
    this.uidContainer.text(user.uid);
    firebase.database().ref('/phoneNumbers/' + user.uid).once('value').then(function(snapshot) {
      this.phoneContainer.text(snapshot.val());
    }.bind(this));
    this.signInButton.prop('disabled', false);
    this.signedOutCard.hide();
    this.signedInCard.show();
    // Your user is signed in you can use Firebase at this point!
  } else {
    this.signedOutCard.show();
    this.signedInCard.hide();
  }
};

// Initiates the sign-in flow using LinkedIn sign in in a popup.
Demo.prototype.onSignInButtonClick = function() {
  this.signInButton.prop('disabled', true);
  Digits.logIn({
    accountFields: Digits.AccountFields.Email
  }).done(this.onDigitsLogin.bind(this)).fail(this.onError.bind(this));
};

/**
 * Handle the login once the user has completed the sign in with Digits. We POST digits headers to
 * the server to safely invoke the Digits API and get the logged-in user's data using which is used
 * to create a Firebase custom auth token.
 */
Demo.prototype.onDigitsLogin = function(loginResponse) {
  console.log('Digits login succeeded. Now sending OAuth echo headers to the server.');

  $.ajax({
    type: 'POST',
    url: '/digits',
    headers: loginResponse.oauth_echo_headers,
    success: this.onAuthTokenReceived.bind(this),
    error: this.onError.bind(this)
  });
};

// Triggers on Digits auth errors.
Demo.prototype.onError = function(error) {
  this.signInButton.prop('disabled', false);
  console.error(error);
};

// We received a successful response from the server.
Demo.prototype.onAuthTokenReceived = function(firebaseToken) {
  console.log('Digit user data was retrieved and Firebase auth token was created.');
  firebase.auth().signInWithCustomToken(firebaseToken);
};

// Signs-out of Firebase.
Demo.prototype.onSignOutButtonClick = function() {
  firebase.auth().signOut();
};

// Deletes the user's account.
Demo.prototype.onDeleteAccountButtonClick = function() {
  // Delete the phone number in the Database.
  firebase.database().ref('/phoneNumbers/' + firebase.auth().currentUser.uid).remove().then(function() {
    // Delete the account.
    firebase.auth().currentUser.delete().then(function() {
      window.alert('Account deleted');
    }).catch(function(error) {
      if (error.code === 'auth/requires-recent-login') {
        window.alert('You need to have recently signed-in to delete your account. Please sign-in and try again.');
        firebase.auth().signOut();
      }
    });
  });
};

// Load the demo.
new Demo();
