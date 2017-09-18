//
//  ViewController.swift
//  KakaoLoginIOS
//
//  Created by Kevin Kang on 2017. 9. 15..
//  Copyright © 2017년 Hara Kang. All rights reserved.
//

import UIKit
import FirebaseAuth
import SDWebImage

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if Auth.auth().currentUser == nil {
            if KOSession.shared().isOpen() {
                requestFirebaseJwt(accessToken: KOSession.shared().accessToken)
            }
        } else {
            self .performSegue(withIdentifier: "loginSegue", sender: self)
            
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func loginButtonClicked(_ sender: UIButton) {
        KOSession.shared().close()
        KOSession.shared().open { (error) in
            if KOSession.shared().isOpen() {
                self.requestFirebaseJwt(accessToken: KOSession.shared().accessToken)
            } else {
                print("login failed")
            }
        }
    }
    
    /**
        Request firebase token from the validation server.
    */
    func requestFirebaseJwt(accessToken: String) {
        let url = URL(string: String.init(format: "%@/verifyToken", Bundle.main.object(forInfoDictionaryKey: "VALIDATION_SERVER_DOMAIN") as! String))!
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
            print("Error in adding token as a parameter")
        }
        
        URLSession.shared.dataTask(with: urlRequest) { (data, response, error) in
            guard let data = data, error == nil else { return }
            do {
                let jsonResponse = try JSONSerialization.jsonObject(with: data, options: []) as! [String: String]
                let firebaseToken = jsonResponse["firebase_token"]!
                self.signInToFirebaseWithToken(firebaseToken: firebaseToken)
            } catch let error as NSError {
                print(error)
            }
        
        }.resume()
    }
    
    /**
        Sign in to Firebse with the custom token generated from the validation server.
        
        Performs segue if signed in successfully.
    */
    func signInToFirebaseWithToken(firebaseToken: String) {
        Auth.auth().signIn(withCustomToken: firebaseToken) { (user, error) in
            if error != nil {
                print(error!)
                return
            }
            self.performSegue(withIdentifier: "loginSegue", sender: self)
        }
    }
}
