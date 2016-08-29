/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 package com.google.firebase.digitsauth;

import android.app.Application;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.util.Log;

import com.digits.sdk.android.AuthCallback;
import com.digits.sdk.android.Digits;
import com.digits.sdk.android.DigitsException;
import com.digits.sdk.android.DigitsOAuthSigning;
import com.digits.sdk.android.DigitsSession;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.twitter.sdk.android.core.TwitterAuthConfig;
import com.twitter.sdk.android.core.TwitterAuthToken;
import com.twitter.sdk.android.core.TwitterCore;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

import io.fabric.sdk.android.Fabric;
import io.fabric.sdk.android.services.concurrency.AsyncTask;

public class DigitsAuthApplication extends Application {

    private AuthCallback mDigitsAuthCallback;
    private FirebaseAuth.AuthStateListener mAuthListener;
    private FirebaseAuth mAuth;

    private static final String TAG = DigitsAuthApplication.class.getName();

    // Note: Your consumer key and secret should be obfuscated in your source code before shipping.
    private static final String DIGITS_KEY = "<YOUR_DIGITS_CONSUMER_KEY>"; // TODO: Change this to your project's Consumer Key
    private static final String DIGITS_SECRET = "<YOUR_DIGITS_CONSUMER_SECRET>"; // TODO: Change this to your project's Consumer Secret

    // The URL to the server's endpoint that creates the Firebase Custom Auth token.
    private static final String SERVER_TOKEN_ENDPOINT = "https://<YOUR_SERVER_DOMAIN>/digits"; // TODO: Change this to your server's domain


    @Override
    public void onCreate() {
        super.onCreate();
        startDigitsAuthCallback();
        startFirebaseAuthCallback();
    }

    private void startDigitsAuthCallback() {
        TwitterAuthConfig authConfig = new TwitterAuthConfig(DIGITS_KEY, DIGITS_SECRET);
        Fabric.with(this, new TwitterCore(authConfig), new Digits.Builder().build());
        mDigitsAuthCallback = new AuthCallback() {
            @Override
            public void success(DigitsSession session, String phoneNumber) {
                // Get OAuth Echo headers
                TwitterAuthConfig authConfig = TwitterCore.getInstance().getAuthConfig();
                TwitterAuthToken authToken = session.getAuthToken();
                DigitsOAuthSigning oauthSigning = new DigitsOAuthSigning(authConfig, authToken);
                Map<String, String> authHeaders = oauthSigning.getOAuthEchoHeadersForVerifyCredentials();

                // Send OAuth echo headers to the server
                new RetrieveTokenTask().execute(authHeaders);
            }

            @Override
            public void failure(DigitsException exception) {
                // Do something on failure
            }
        };
    }

    // Starts listening for Firebase auth state.
    private void startFirebaseAuthCallback() {
        mAuthListener = new FirebaseAuth.AuthStateListener() {
            @Override
            public void onAuthStateChanged(@NonNull FirebaseAuth firebaseAuth) {
                FirebaseUser user = firebaseAuth.getCurrentUser();
                Context context = DigitsAuthApplication.this.getApplicationContext();
                if (user != null) {
                    // User has signed in. We display the user's information in a new activity.
                    Log.d(TAG, "User signed in Firebase: " + user.getUid());
                    Intent userSignedIn = new Intent("com.google.firebase.usersignedin");
                    userSignedIn.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    PendingIntent pendingIntent = PendingIntent.getActivity(context, 22, userSignedIn, 0);
                    try {
                        pendingIntent.send();
                    } catch (PendingIntent.CanceledException e) {
                        Log.e(TAG, "Error while creating Signed In User activity", e);
                    }
                } else {
                    // User signed out we'll finish the UserSignedInActivity if active.
                    if (UserSignedInActivity.instance != null) {
                        UserSignedInActivity.instance.finish();
                    }
                    Log.d(TAG, "User signed out");
                }
            }
        };
        mAuth = FirebaseAuth.getInstance();
        mAuth.addAuthStateListener(mAuthListener);
    }

    public AuthCallback getAuthCallback(){
        return mDigitsAuthCallback;
    }

    /**
     * Sends the given a list of OAuthEcho headers to the backend and gets the Firebase custom auth
     * token.
     */
    class RetrieveTokenTask extends AsyncTask<Map<String, String>, Void, String> {

        private Exception exception;

        @Override
        @SafeVarargs
        final protected String doInBackground(Map<String, String>... oauthEchoHeaders) {
            try {
                // Sending a request to the digits endpoint of our server.
                URL url = new URL(SERVER_TOKEN_ENDPOINT);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");

                // Add OAuth Echo headers to request.
                for (Map.Entry<String, String> entry : oauthEchoHeaders[0].entrySet()) {
                    connection.setRequestProperty(entry.getKey(), entry.getValue());
                }

                // Perform request.
                BufferedReader in = new BufferedReader(
                        new InputStreamReader(connection.getInputStream()));

                // Read the token from the response.
                String token = in.readLine();
                in.close();
                return token;
            } catch (Exception e) {
                this.exception = e;
                return null;
            }
        }

        @Override
        protected void onPostExecute(String token) {
            if (exception != null) {
                Log.e(TAG, "Error While retrieving Custom token.", exception);
                return;
            }
            Log.d(TAG, "retrievedCustomToken:" + token);
            mAuth.signInWithCustomToken(token);
        }
    }
}
