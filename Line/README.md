# Use LINE Login with Firebase

This sample shows how to Sign in Firebase using [LINE Login](https://developers.line.me/line-login/overview).

## Setup the sample

### LINE business account's creation and setup

 1. Follow the instruction in [LINE Developers document](https://developers.line.me/line-login/overview) to setup a LINE business account.
 1. After finished setting up your channel, follow the document to integrate LINE SDK in your [iOS](https://developers.line.me/ios/overview) and [Android](https://developers.line.me/android/overview) app. It should include:
  * Open **Technical Configuration** page of your LINE channel, and update the following values:
    * iOS Bundle ID: `com.google.firebase.LINELoginDemo`
    * Android Package Name: `com.google.firebase.linelogindemo`
    * Android Package Signature: The SHA1 value of your keystore, without semicolons
  * Download the LINE SDK for iOS and Android from LINE developers site and add them to your apps. The latest version of LINE SDK may have different API with that used to create the sample app, so you may need to make some changes to the sample apps. LINE SDK versions being used in building the sample apps are:
    *  iOS: **3.2.1**
    *  Android: **3.1.20** 
  * Update your Channel ID to your apps
    * iOS: Update `<your_channel_id>` in `LineAdapter.plist`
    * Android: Update `<your_channel_id>` in `app/build.gradle` 
    * Server: Update `<your_channel_id>` in `config.js` 

### Firebase app creation and setup

 1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
 1. **For the iOS app:** Go to **Firebase Console > Overview > Add Firebase to your iOS app** and create an app with the Bundle ID of `com.google.firebase.LINELoginDemo`. This will trigger your browser to download a `GoogleService-Info.plist` config file. Add this config file to your sample iOS app, then run `pod install` to make download necessary CocoaPods dependencies.
 1. **For the Android app:** Go to **Firebase Console > Overview > Add Firebase to your Android app** and create an app with the Package name of `com.google.firebase.linelogindemo`. This will trigger your browser to download a `google-services.json` config file. Add this config file to your sample Android app.
  * If you have problem creating a your Android app, try changing the Android app's package name to your own value (e.g. `com.yourdomain.linelogindemo`) and try again. Remember to update the package name inside your Android app and in your LINE Channel's **Technical Configuration** page as well.
 
Create and provide a Service Account's keys:
 1. Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
 1. Save the Service Account credential file as `service-account.json` and copy it to `server/`.

## Run the sample

### Server

Before running your iOS and Android sample app, you need to start the sample server.

You can run it locally by running `npm run start` in a console, or deploy to the cloud. Refer [here](#deploy-the-server-sample) on how to deploy to Google Cloud Platform.

Then update your iOS and Android app with the address of your local machine:
 * iOS: In `Constant.h`, replace the placeholder text with your server domain.
 * Android: In `LineLoginUtils.java`, replace `LINE_ACCESSCODE_VERICATION_DOMAIN` constant value with your server domain.

As your iOS / Android sample app will access the server from a real device or a simulator, please make sure that you will use the network address of your local server, not `http://localhost:8080`.

### iOS, Android

Build the sample iOS and Android app and run them on your devices. Those sample apps should be working by now. If you seeing any compile errors or the apps crash when start, please refer back to the setup instruction above and check if you missed anything.

## Deploy the server sample

You can deploy the sample's server on App Engine Flex. For this:
  * Download and setup the [gcloud](https://cloud.google.com/sdk/) CLI.
  * Make sure Billing is enabled in your Google project and that Google Compute Instance is also enabled.
  * Run `cd server & gcloud app deploy`

 Your app will be available under your App Engine URL: `https://<project-id>.appspot.com`

## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../LICENSE) license.
