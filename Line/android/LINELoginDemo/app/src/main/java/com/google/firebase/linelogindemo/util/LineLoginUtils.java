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

package com.google.firebase.linelogindemo.util;

import android.app.Activity;
import android.support.annotation.NonNull;
import android.util.Log;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;

import jp.line.android.sdk.LineSdkContext;
import jp.line.android.sdk.LineSdkContextManager;
import jp.line.android.sdk.exception.LineSdkLoginException;
import jp.line.android.sdk.login.LineAuthManager;
import jp.line.android.sdk.login.LineLoginFuture;
import jp.line.android.sdk.login.LineLoginFutureListener;

public class LineLoginUtils {

    public interface LoginCallback {
        void onSuccess();
        void onFail();
    }

    /***** Update your validation server domain here *****/
    public static final String LINE_ACCESSCODE_VERICATION_DOMAIN = "<your_line_token_verification_server>"; // Example: https://linelogindemo.appspot.com
    /***** *****/

    private static final String LINE_ACCESSCODE_VERIFICATION_URL = LINE_ACCESSCODE_VERICATION_DOMAIN + "/verifyToken";
    private static final String TAG = LineLoginUtils.class.getCanonicalName();

    public static void startLineLogin(final Activity activity, final LoginCallback callback) {
        LineSdkContext sdkContext = LineSdkContextManager.getSdkContext();
        LineAuthManager authManager = sdkContext.getAuthManager();
        LineLoginFuture loginFuture = authManager.login(activity);
        loginFuture.addFutureListener(new LineLoginFutureListener() {
            @Override
            public void loginComplete(LineLoginFuture future) {
            switch(future.getProgress()) {
                case SUCCESS: //Login successfully
                    requestFirebaseAuthToken(activity, callback);
                    break;
                case CANCELED: // Login canceled by user
                    callback.onFail();
                    break;
                default: /* Error */ {
                    Throwable cause = future.getCause();
                    if (cause instanceof LineSdkLoginException) {
                        LineSdkLoginException loginException = (LineSdkLoginException)cause;
                        Log.e(TAG, loginException.getMessage());
                    }
                    callback.onFail();
                } break;
            }
            }
        });
    }

    private static void requestFirebaseAuthToken(final Activity activity, final LoginCallback callback) {
        // Get LINE Access token
        LineAuthManager authManager = LineSdkContextManager.getSdkContext().getAuthManager();
        final String accessToken = authManager.getAccessToken().accessToken;
        Log.d(TAG, "LINE Access token = " + accessToken);

        HashMap<String, String> validationObject = new HashMap<>();
        validationObject.put("token", accessToken);

        // Exchange LINE Access Token for Firebase Auth Token
        Response.Listener<JSONObject> responseListener = new Response.Listener<JSONObject>() {
            @Override
            public void onResponse(JSONObject response) {
            try {
                String firebaseToken = response.getString("firebase_token");
                Log.d(TAG, "Firebase Token = " + firebaseToken);

                // Authenticate with Firebase
                FirebaseAuth auth = FirebaseAuth.getInstance();
                auth.signInWithCustomToken(firebaseToken)
                        .addOnCompleteListener(activity, new OnCompleteListener<AuthResult>() {
                            @Override
                            public void onComplete(@NonNull Task<AuthResult> task) {
                                Log.d(TAG, "signInWithCustomToken:onComplete:" + task.isSuccessful());

                                if (task.isSuccessful()) {
                                    callback.onSuccess();
                                } else {
                                    callback.onFail();
                                }
                            }
                        });
            } catch (JSONException e) {
                callback.onFail();
            }

            }
        };

        Response.ErrorListener errorListener = new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.e(TAG, error.toString());
                callback.onFail();
            }
        };

        JsonObjectRequest fbTokenRequest = new JsonObjectRequest(
                Request.Method.POST, LINE_ACCESSCODE_VERIFICATION_URL,
                new JSONObject(validationObject),
                responseListener, errorListener);

        NetworkSingleton.getInstance(activity).addToRequestQueue(fbTokenRequest);

    }

    public static void signOut() {
        FirebaseAuth.getInstance().signOut();
        LineSdkContextManager.getSdkContext().getAuthManager().logout();
    }

}
