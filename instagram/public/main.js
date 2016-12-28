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
    this.signInButton = document.getElementById('demo-sign-in-button');
    this.signOutButton = document.getElementById('demo-sign-out-button');
    this.nameContainer = document.getElementById('demo-name-container');
    this.uidContainer = document.getElementById('demo-uid-container');
    this.deleteButton = document.getElementById('demo-delete-button');
    this.profilePic = document.getElementById('demo-profile-pic');
    this.signedOutCard = document.getElementById('demo-signed-out-card');
    this.signedInCard = document.getElementById('demo-signed-in-card');
    this.picsContainer = document.getElementById('demo-pics-container');

    // Bind events.
    this.signInButton.addEventListener('click', this.onSignInButtonClick.bind(this));
    this.signOutButton.addEventListener('click', this.onSignOutButtonClick.bind(this));
    this.deleteButton.addEventListener('click', this.onDeleteAccountButtonClick.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
  }.bind(this));
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function(user) {
  // Skip token refresh.
  if(user && user.uid === this.lastUid) return;

  this.picsContainer.innerHTML = '';
  if (user) {
    this.lastUid = user.uid;
    this.nameContainer.innerText = user.displayName;
    this.uidContainer.innerText = user.uid;
    this.profilePic.src = user.photoURL;
    this.signedOutCard.style.display = 'none';
    this.signedInCard.style.display = 'block';
    this.instagramTokenRef = firebase.database().ref('/instagramAccessToken/' + user.uid);
    this.showInstagramPics();
  } else {
    this.lastUid = null;
    this.picsContainer.innerHTML = '';
    this.signedOutCard.style.display = 'block';
    this.signedInCard.style.display = 'none';
  }
};

// Initiates the sign-in flow using LinkedIn sign in in a popup.
Demo.prototype.showInstagramPics = function() {
  // The Instagram Access Token is saved in the Realtime Database. We fetch it first.
  this.instagramTokenRef.once('value').then(function(snapshot) {
    var accessToken = snapshot.val();
    var feed = new Instafeed({
      get: 'user',
      userId: 'self',
      target: this.picsContainer,
      accessToken: accessToken,
      limit: 10,
      resolution: 'low_resolution',
      error: function(e) {
        // If the Instagram auth token has been revoked we sign out the user.
        if (e === 'The access_token provided is invalid.') {
          firebase.auth().signOut();
        }
      },
      template: '<a href="mailto:?Subject=My%20Instagram%20Pic&body=Hey%20there!%0A%0AHave%20a%20look%20at%20my%20Instagram%20pic:%20{{link}}" target="_blank"><img src="{{image}}"/></a>'
    });
    feed.run();
  }.bind(this));
};

// Initiates the sign-in flow using LinkedIn sign in in a popup.
Demo.prototype.onSignInButtonClick = function() {
  // Open the Auth flow as a popup.
  window.open('/redirect', 'firebaseAuth', 'height=315,width=400');
};

// Signs-out of Firebase.
Demo.prototype.onSignOutButtonClick = function() {
  firebase.auth().signOut();
};

// Deletes the user's account.
Demo.prototype.onDeleteAccountButtonClick = function() {
  this.instagramTokenRef.remove().then(function() {
    firebase.auth().currentUser.delete().then(function () {
      window.alert('Account deleted');
    }).catch(function (error) {
      if (error.code === 'auth/requires-recent-login') {
        window.alert('You need to have recently signed-in to delete your account. Please sign-in and try again.');
        firebase.auth().signOut();
      }
    });
  });
};

// Load the demo.
new Demo();
