//
//  LineAuthManager.m
//  LINELoginDemo
//
//  Created by Khanh LeViet on 10/6/16.
//  Copyright (c) Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

#import "LineAuthManager.h"
#import <LineAdapter/LineSDK.h>
#import <GTMHTTPFetcher.h>
#import "Constants.h"
@import FirebaseAuth;

@interface LineAuthManager ()

@property (nonatomic, strong) LineAdapter *lineAdapter;
@property (nonatomic, weak) UIViewController *topViewController;
@property (nonatomic, strong) FIRAuthResultCallback resultCallback;

@property (nonatomic, strong) GTMHTTPFetcher *firebaseTokenFetcher;

@end

@implementation LineAuthManager

#pragma mark - Step 1: Communication with LINE SDK
- (void)startLINELoginWithTopViewController:(UIViewController *)viewController completionHandler:(FIRAuthResultCallback)callback {
    self.topViewController = viewController;
    self.resultCallback = callback;
    
    // STEP 1: User logins with LINE and get their LINE access token
    if ([self.lineAdapter isAuthorized]) {
        // If the authentication and authorization process has already been performed, start step 2 validating LINE access token
        NSString *lineAccessToken = self.lineAdapter.getLineApiClient.accessToken;
        [self requestFirebaseAuthTokenWithLINEAccessToken:lineAccessToken];
    } else {
        if ([self.lineAdapter canAuthorizeUsingLineApp]) {
            // Authenticate with LINE application
            [self.lineAdapter authorize];
        }
        else {
            // Authenticate with WebView
            UIViewController *viewController;
            viewController = [[LineAdapterWebViewController alloc] initWithAdapter:self.lineAdapter
                                                            withWebViewOrientation:LineAdapterWebViewOrientationAll];
            [[viewController navigationItem] setLeftBarButtonItem:[LineAdapterNavigationController
                                                                   barButtonItemWithTitle:@"Cancel" target:self action:@selector(cancel:)]];
            UIViewController *navigationController;
            navigationController = [[LineAdapterNavigationController alloc] initWithRootViewController:viewController];
            [self.topViewController presentViewController:navigationController animated:YES completion:nil];
        }
    }
}

- (void)cancel:(id)sender {
    [self.topViewController dismissViewControllerAnimated:YES completion:nil];
}

- (void)lineAdapterAuthorizationDidChange:(NSNotification*)aNotification {
    LineAdapter *_adapter = [aNotification object];
    if ([_adapter isAuthorized]) {
        if (![self.lineAdapter canAuthorizeUsingLineApp]) {
            // Authenticated using Webview, so need to dismiss the webview controller
            if (self.topViewController.presentedViewController) {
                [self.topViewController dismissViewControllerAnimated:YES completion:nil];
            }
        }
        
        // Connection completed to LINE. Start step 2 validating LINE access token
        NSString *lineAccessToken = self.lineAdapter.getLineApiClient.accessToken;
//        NSLog(@"DEBUG: LINE Access Token = %@",lineAccessToken);
        [self requestFirebaseAuthTokenWithLINEAccessToken:lineAccessToken];
    } else {
        // Return error to login callback
        NSError *error = [[aNotification userInfo] objectForKey:@"error"];
        if (error)
        {
            [self returnSignInResult:nil error:error];
        }
    }
}

#pragma mark - Step 2: Communication with own validation server
- (void)requestFirebaseAuthTokenWithLINEAccessToken:(NSString *)lineAccessToken {
    // Stop current Firebase token fetcher if there's any
    if (self.firebaseTokenFetcher && self.firebaseTokenFetcher.isFetching) {
        [self.firebaseTokenFetcher stopFetching];
    }
    
    // STEP 2: Exchange LINE access token for Firebase Custom Auth token
    NSString *urlString = [NSString stringWithFormat:@"%@/verifyToken", YOUR_VALIDATION_SERVER_DOMAIN];
    NSURL *url = [NSURL URLWithString:urlString];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    [request setHTTPMethod:@"POST"];
    [request setValue:@"application/json" forHTTPHeaderField:@"content-type"];
    
    NSDictionary *token = @{@"token" : lineAccessToken};
    NSError *error;
    NSData *requestBody = [NSJSONSerialization dataWithJSONObject:token
                                                          options:kNilOptions error:&error];
    if (error) {
        [self returnSignInResult:nil error:error];
    }
    [request setHTTPBody:requestBody];
    
    self.firebaseTokenFetcher = [GTMHTTPFetcher fetcherWithRequest:request];
    self.firebaseTokenFetcher.allowedInsecureSchemes = @[@"http"]; // Allow fetching http so that you can run your server sample code locally without https
    __weak typeof(self) wSelf = self;
    
    [self.firebaseTokenFetcher beginFetchWithCompletionHandler:^(NSData *data, NSError *error) {
        if (error) {
            [wSelf returnSignInResult:nil error:error];
        } else {
            NSError *jsonSerializationError;
            NSDictionary *response = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&jsonSerializationError];
            
            if (error) {
                [wSelf returnSignInResult:nil error:jsonSerializationError];
            } else {
                NSString *firebaseToken = response[@"firebase_token"];
                [wSelf authenticateWithFirebaseToken:firebaseToken];
            }
        }
    }];
}

#pragma mark - Step 3: Communication with Firebase Auth SDK
- (void)authenticateWithFirebaseToken:(NSString *)firebaseToken {
    // STEP 3: Login to Firebase using Firebase Custom Auth token
    [[FIRAuth auth] signInWithCustomToken:firebaseToken completion:^(FIRUser * _Nullable user, NSError * _Nullable error) {
        if (error) {
            [self returnSignInResult:nil error:error];
            return;
        }
        
        // Try to update
        [self updateUserProfile:user];
    }];
}

#pragma mark - Step 4: (Optional) Update user profile with LINE Profile
- (void)updateUserProfile:(FIRUser *)user {
    BOOL isProfileNeededUpdate = ([user.displayName length] == 0) || ([[user.photoURL absoluteString] length] == 0);
    if (!isProfileNeededUpdate) {
        [self returnSignInResult:user error:nil];
    }
    
    // STEP 4: (Optional) Update user profile with LINE Profile
    __weak typeof(self) wSelf = self;
    [self.lineAdapter.getLineApiClient getMyProfileWithResultBlock:^(NSDictionary *aResult, NSError *aError) {
        if (aError) {
            // Ignore LINE profile fetch error as this step is optional
            [self returnSignInResult:user error:nil];
            return;
        }
        
        // Update Firebase profile with LINE profile
        FIRUserProfileChangeRequest *request = user.profileChangeRequest;
        request.displayName = aResult[@"displayName"];
        if (aResult[@"pictureUrl"]) {
            request.photoURL = [NSURL URLWithString:aResult[@"pictureUrl"]];
        }
        [request commitChangesWithCompletion:^(NSError * _Nullable error) {
            // Ignore profile update error as this step is optional
            [wSelf returnSignInResult:user error:nil];
        }];
    }];
}


#pragma mark - Sign out
- (void)signOut {
    [self.lineAdapter unauthorize];
    [[FIRAuth auth] signOut:nil];
}

#pragma mark - Internal methods
+ (instancetype)sharedInstance {
    static LineAuthManager *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

- (instancetype)init {
    self = [super init];
    
    if (self) {
        // Initialize LINE Adapter
        self.lineAdapter = [LineAdapter defaultAdapter];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(lineAdapterAuthorizationDidChange:)
                                                     name:LineAdapterAuthorizationDidChangeNotification object:nil];
    }
    
    return self;
}

- (void)returnSignInResult:(FIRUser *)user error:(NSError *)error {
    if (self.resultCallback == nil) return;
    
    // Execute result callback
    if (error) {
        // Force signout of LINE and Firebase
        [self signOut];
        self.resultCallback(nil, error);
    } else {
        self.resultCallback(user, nil);
    }
    
    // Release objects that are no longer neccessary
    self.topViewController = nil;
    self.resultCallback = nil;
}

@end
