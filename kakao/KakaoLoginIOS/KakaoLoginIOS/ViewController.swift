/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import UIKit
import FirebaseAuth
import SDWebImage

class ViewController: UIViewController {
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if Auth.auth().currentUser == nil {
            if KOSession.shared().isOpen() {
                requestFirebaseJwt(accessToken: KOSession.shared().accessToken)
            }
        } else {
            self.performSegue(withIdentifier: "loginSegue", sender: self)
        }
    }

    @IBAction func loginButtonClicked(_ sender: UIButton) {
        KOSession.shared().close()
        KOSession.shared().open { (error) in
            if KOSession.shared().isOpen() {
                self.requestFirebaseJwt(accessToken: KOSession.shared().accessToken)
            } else {
                print("login failed: \(error!)")
            }
        }
    }
    
    /**
        Request firebase token from the validation server.
    */
    func requestFirebaseJwt(accessToken: String) {
        let url = URL(string: String(format: "%@/verifyToken", Bundle.main.object(forInfoDictionaryKey: "VALIDATION_SERVER_URL") as! String))!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        
        
        let token = KOSession.shared().accessToken!
        let parameters: [String: String] = ["token": token]
        
        do {
            let jsonParams = try JSONSerialization.data(withJSONObject: parameters, options: [])
            urlRequest.httpBody = jsonParams
        } catch {
            print("Error in adding token as a parameter: \(error)")
        }
        
        URLSession.shared.dataTask(with: urlRequest) { (data, response, error) in
            guard let data = data, error == nil else {
                print("Error in request token verifying: \(error!)")
                return
            }
            do {
                let jsonResponse = try JSONSerialization.jsonObject(with: data, options: []) as! [String: String]
                let firebaseToken = jsonResponse["firebase_token"]!
                self.signInToFirebaseWithToken(firebaseToken: firebaseToken)
            } catch let error {
                print("Error in parsing token: \(error)")
            }
        
        }.resume()
    }
    
    /**
        Sign in to Firebse with the custom token generated from the validation server.
        
        Performs segue if signed in successfully.
    */
    func signInToFirebaseWithToken(firebaseToken: String) {
        Auth.auth().signIn(withCustomToken: firebaseToken) { (user, error) in
            if let authError = error {
                print(authError)
            } else {
                self.performSegue(withIdentifier: "loginSegue", sender: self)
            }
        }
    }
}
