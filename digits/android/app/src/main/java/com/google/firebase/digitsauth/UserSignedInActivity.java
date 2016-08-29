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

import android.app.Activity;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.TextView;

import com.digits.sdk.android.AuthConfig;
import com.digits.sdk.android.Digits;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthRecentLoginRequiredException;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

// The UserSignedInActivity shows information about the Firebase User.
public class UserSignedInActivity extends AppCompatActivity implements OnFailureListener {

    FirebaseDatabase mDatabase;
    FirebaseAuth mAuth;
    TextView mUid;
    TextView mEmail;
    TextView mPhone;

    // Tracking the last created instance.
    public static Activity instance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        setContentView(R.layout.activity_user_info);
        mDatabase = FirebaseDatabase.getInstance();
        mAuth = FirebaseAuth.getInstance();
        mUid = (TextView) findViewById(R.id.uid_value);
        mPhone = (TextView) findViewById(R.id.phone_value);
        mEmail = (TextView) findViewById(R.id.email_value);
    }

    @Override
    protected void onStart() {
        super.onStart();
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

        if (user != null) {
            mUid.setText(user.getUid());
            mEmail.setText(user.getEmail());
            DatabaseReference phoneRef = mDatabase.getReference("/phoneNumbers/" + user.getUid());
            phoneRef.addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    mPhone.setText(dataSnapshot.getValue(String.class));
                }

                @Override
                public void onCancelled(DatabaseError databaseError) {
                }
            });
        }
    }

    // Triggered when clicking the Sign Out button.
    public void onSignOutButtonClick(View view) {
        FirebaseAuth.getInstance().signOut();
    }

    // Triggered when clicking the Delete Account button.
    public void onDeleteButtonClick(View view) {
        if (mAuth.getCurrentUser() != null) {
            mAuth.getCurrentUser().delete().addOnFailureListener(this);
        }
    }

    @Override
    public void onFailure(@NonNull Exception e) {
        if (e instanceof FirebaseAuthRecentLoginRequiredException) {
            new AlertDialog.Builder(UserSignedInActivity.this)
                    .setTitle(R.string.need_fresh_sign_in_title)
                    .setMessage(R.string.need_fresh_sign_in_text)
                    .show();
        }
    }
}
