# Use Instagram Sign In with Firebase

This sample shows how to Sign in Firebase using [Instagram](https://www.instagram.com/developer/) on the Web.

You can try this sample at: [instagram-auth.appspot.com](https://instagram-auth.appspot.com).


## Setup the sample

### Instagram app's creation and setup

 1. Register an Instagram app on [Instagram for Developers](https://www.instagram.com/developer/). You'll need to **Register a New Client**.
 1. Once Your app is created make sure you specify your app's callback URL in the list of **Valid redirect URIs** of your Instagram app. You should whitelist `http://localhost:8080/instagram-callback` for local development and if you deploy on App Engine (See Deploy section below) you should whitelist the URL `https://<project-id>.appspot.com/instagram-callback`.
 1. Copy the **Client ID** and the **Client Secret** of your Instagram app and copy it into `config.json` in place of the placeholders.


### Firebase app creation and setup

 1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
 1. **For the web app:** Copy the Web initialisation snippet from **Firebase Console > Overview > Add Firebase to your web app** and paste it in `public/index.html` in lieu of the placeholders (where the `TODO(DEVELOPER)` is located).
 1. **For the server:** From the Firebase initialization snippet copy the `apiKey` value and paste it in `config.json` as the value of `firebase.apiKey` in lieu of the placeholder.

Create and provide a Service Account's keys:
 1. Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
 1. Save the Service Account credential file as `service-account.json`

Deploy your security rules:
 1. Run `firebase use --add` and choose your Firebase project. This will configure the Firebase CLI to use the correct
    project locally.
 1. Run `firebase deploy` to deploy the security rules of the Realtime Database


## Run the sample locally

### Web

You can run the sample web app locally by running `npm run start` in a console.

Then open `http://localhost:8080` in your browser.

Click on the **Sign in with Instagram** button and a popup window will appear that will let you sign in with your Instagram account.

After signing-in the app should display your name, profile pic and Instagram Pics. At this point you are authenticated in Firebase and can use the database/hosting etc...
The app shows a simple


## Deploy the sample

You can deploy the sample's web app and server on App Engine Flex. For this:
 - Download and setup the [gcloud](https://cloud.google.com/sdk/) CLI.
 - Make sure Billing is enabled in your Google project and that Google Compute Instance is also enabled.
 - Run `gcloud app deploy`

 Your app will be available under your App Engine URL: `https://<project-id>.appspot.com`


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../LICENSE) license.
