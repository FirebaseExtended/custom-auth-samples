# Use Digits Sign In with Firebase

This sample shows how to Sign in Firebase using [Digits](https://get.digits.com).


## Setup the sample

### Fabric app's creation and setup

 1. Create a Fabric app on [fabric.io](https://fabric.io/) this will require you to install the Fabric Android Studio plugin and create an app. When creating an app make sure it has the same package as your final app. In this sample we're using `com.google.firebase.digitsauth`.
 1. Once Your app is created make sure you specify your app's URL in your Fabric app's config so that your domain is whitelisted for dong Digits web sign in. If you deploy on App Engine (See Deploy section below) you should whitelist the URL `https://<project-id>.appspot.com/`.
 1. Copy the **Consumer Key** of your Digits app and copy it into `server/config.json`, `server/public/index.html` and the [com.firebase.digitsauth.DigitsAuthApplication](android/app/src/main/java/com/firebase/digitsauth/DigitsAuthApplication.java) classin place of the placeholders.
 1. Copy the **Consumer Secret** of your Digits app and copy it into the [com.firebase.digitsauth.DigitsAuthApplication](android/app/src/main/java/com/firebase/digitsauth/DigitsAuthApplication.java) class in place of the placeholder.


### Firebase app creation and setup

 1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
 1. **For the web app:** Copy the Web initialisation snippet from **Firebase Console > Overview > Add Firebase to your web app** and paste it in `server/public/index.html` in lieu of the placeholders (where the `TODO(DEVELOPER)` is located).
 1. **For the server:** From the Firebase initialization snippet copy the `apiKey` value and paste it in `server/config.json` as the value of `firebase.apiKey` in lieu of the placeholder.
 1. **For the Android app:** Click on **Firebase Console > Overview > Add Firebase to your Android app**, enter the package name `com.google.firebase.digitsauth` click "ADD APP" and copy the generated `google-services.json` file into the `android/app` folder.

Create and provide a Service Account's keys:
 1. Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
 1. Save the Service Account credential file as `server/service-account.json`

Deploy your security rules:
 1. Run `firebase use --add` and choose your Firebase project. This will configure the Firebase CLI to use the correct
    project locally.
 1. Run `firebase deploy` to deploy the security rules of the Realtime Database


### Android app

In your Android app you need to specify the URL of the server endpoint that creates the Firebase Custom auth token.
If you have deployed your server to App Engine (see section below) you can specify `https://<project-id>.appspot.com/digits` into the [com.firebase.digitsauth.DigitsAuthApplication](android/app/src/main/java/com/firebase/digitsauth/DigitsAuthApplication.java) class in place of the placeholder.


## Run the sample locally

### Web

You can run the sample web app locally by doing:

```bash
cd server
npm run start
```

Then open `http://localhost:8080` in your browser.

Click on the **Sign in with Digits** button and a popup window will appear that will let you sign in with your mobile phone number.

After signing-in the app should display your email and phone number from Digits. At this point you are authenticated in Firebase and can use the database/hosting etc...


### Android app

You can run the sample Android app by opening the project in Android Studio and Running the app in an Emulator or a physical device.

You also need the server to be running, either deployed online (See next section) or reachable by your Android app in your local network. This depends on the Server URL you entered in the Android app setup.


## Deploy the sample

You can deploy the sample's web app and server on App Engine Flex. For this:
 - Download and setup the [gcloud](https://cloud.google.com/sdk/) CLI.
 - Make sure Billing is enabled in your Google project and that Google Compute Instance is also enabled.
 - Run `cd server & gcloud app deploy`

 Your app will be available under your App Engine URL: `https://<project-id>.appspot.com`


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2015. Licensed under an [Apache-2](../LICENSE) license.