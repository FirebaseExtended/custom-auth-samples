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

package com.google.firebase.linelogindemo.activity;

import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.os.Handler;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.android.volley.toolbox.ImageLoader;
import com.android.volley.toolbox.NetworkImageView;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.linelogindemo.R;
import com.google.firebase.linelogindemo.util.LineLoginUtils;
import com.google.firebase.linelogindemo.util.NetworkSingleton;

public class MainActivity extends AppCompatActivity {

    // Views
    private Button mLineLoginButton;
    private View mLoggedInView;
    private TextView mDisplayNameText;
    private NetworkImageView mProfileImageView;

    // Network stack
    private ImageLoader mImageLoader;
    final Handler mHandler = new Handler();

    private final String TAG = this.getClass().getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        bindUIElements();

        mImageLoader = NetworkSingleton.getInstance(this).getImageLoader();
        updateUI();
    }

    private void bindUIElements() {
        // Bind views
        mLineLoginButton = (Button) findViewById(R.id.line_login_button);
        mLoggedInView = (View) findViewById(R.id.logged_in_view);
        mDisplayNameText = (TextView) findViewById(R.id.display_name_text);
        mProfileImageView = (NetworkImageView) findViewById(R.id.profile_image_view);

        // Bind buttons' OnClickListener
        mLineLoginButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onTapLineLogin();
            }
        });
        Button logoutButton = (Button) findViewById(R.id.logout_button);
        logoutButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onTapLogout();
            }
        });
    }

    void onTapLineLogin() {
        final ProgressDialog dialog = new ProgressDialog(this);
        dialog.show();

        LineLoginUtils.startLineLogin(this, new LineLoginUtils.LoginCallback() {
            @Override
            public void onSuccess() {
                mHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        updateUI();
                        dialog.dismiss();
                    }
                });
            }

            @Override
            public void onFail() {
                mHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        updateUI();
                        dialog.dismiss();
                        new AlertDialog.Builder(MainActivity.this)
                                .setMessage("Login failed.")
                                .setPositiveButton(android.R.string.no, new DialogInterface.OnClickListener() {
                                    public void onClick(DialogInterface dialog, int which) {
                                    // do nothing
                                    }
                                })
                                .setIcon(android.R.drawable.ic_dialog_alert)
                                .show();
                    }
                });
            }
        });
    }

    void onTapLogout() {
        LineLoginUtils.signOut();
        updateUI();
    }

    private void updateUI() {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

        if (user == null) {
            mLineLoginButton.setVisibility(View.VISIBLE);
            mLoggedInView.setVisibility(View.INVISIBLE);
        } else {
            Log.d(TAG, "UID = " + user.getUid());
            Log.d(TAG, "Provider ID = " + user.getProviderId());

            mLineLoginButton.setVisibility(View.INVISIBLE);
            mLoggedInView.setVisibility(View.VISIBLE);

            mDisplayNameText.setText(user.getDisplayName());
            if (user.getPhotoUrl() != null) {
                mProfileImageView.setImageUrl(user.getPhotoUrl().toString(), mImageLoader);
            }

        }
    }

}
