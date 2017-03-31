# Use Kakao Login with Firebase Authentication

This sample shows how to Sign in Firebase using [Kakao Login](https://developers.kakao.com/docs).

## Setup the sample

### Kakao's creation and setup

 1. Follow the instruction in [Kakao Developers Doc](https://developers.kakao.com/docs/android#getting-started-create-app) to setup a Kakao developer account and your application.
 1. After finished setting up your application, follow the document to integrate Kakao SDK in your [Android](https://developers.kakao.com/docs/android) app. It should include:
  * Open **Settings -> General** page of your Kakao application, and create Android platform:
    * Android Package Name: `com.google.firebase.auth.kakao`
    * Android keyHash: The key hash generated using guide in [Launch sample app](https://developers.kakao.com/docs/android#getting-started-launch-sample-app)
  * Import Kakao SDK for Android by adding the following line to your app module's build.gradle file.
    *  compile group: 'com.kakao.sdk', name: 'usermgmt', version: '1.1.33' // The version may be updated
  * Update your Native app key to your apps
    * Android: Update meta-data with key com.kakao.sdk.AppKey to your native app key in 'AndroidManifest.xml'

### Firebase app creation and setup

 1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
 1. **For the Android app:** Go to **Firebase Console > Overview > Add Firebase to your Android app** and create an app with the Package name of `com.google.firebase.auth.kakao`. This will trigger your browser to download a `google-services.json` config file. Add this config file to your sample Android app.
  * If you have problem creating a your Android app, try changing the Android app's package name to your own value (e.g. `com.yourdomain.linelogindemo`) and try again. Remember to update the package name inside your Android app and in your LINE Channel's **Technical Configuration** page as well.

Create and provide a Service Account's keys:
 1. Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
 1. Save the Service Account credential file as `service-account.json` and copy it to `KakaoLoginServer/`.
 (You should not check in this file to your repository as it contains secret key to grant full admin access to your Firebase account.)

## Run the sample

### Server

Before running your iOS and Android sample app, you need to start the sample server.

You can run it locally by running `npm install && node app.js` in a console.

Then update your Android app with the address of your local machine:
 * Android: In `configs.xml`, replace the placeholder text for 'validation_server_domain' with your local server domain.

As your Android sample app will access the server from a real device or a simulator, make sure that you use the network address of your local server, not `http://localhost:8080`.

### Android

Build the sample Android app and run them on your devices by opening build.gradle file under KakaoLoginAndroid with Android Studio. Those sample apps should be working by now. If you seeing any compile errors or the apps crash when start, please refer back to the setup instruction above and check if you missed anything.
