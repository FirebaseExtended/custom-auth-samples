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

import FirebaseAuth

class MainViewController: UIViewController {
    @IBOutlet weak var profileImageView: UIImageView!
    @IBOutlet weak var emailTextView: UITextView!
    @IBOutlet weak var displayNameTextView: UITextView!
    @IBOutlet weak var navigationBar: UINavigationBar!
    @IBOutlet weak var navigationTitleItem: UINavigationItem!
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if let user = Auth.auth().currentUser {
            updateUserProfileUI(user: user)
        } else {
            self.dismiss(animated: true)
        }
    }
    
    /**
        Update profile UI with user information stored on Firebase (email, display name, and profile image)
    */
    func updateUserProfileUI(user: User) {
        self.emailTextView.text = String(format: "Email: %@", user.email!)
        self.displayNameTextView.text = String.init(format: "DisplayName: %@", user.displayName!)
        if let photoURL = user.photoURL {
            profileImageView.sd_setImage(with: photoURL, placeholderImage: #imageLiteral(resourceName: "placeholder.png"), options: [], completed: { (image, error, cacheType, url) in
                if let error = error {
                    print("error in loading profile image. \(error)")
                }
            })
        }
    }
    
    @IBAction func logoutButtonClicked(_ sender: UIButton) {
        do {
            try Auth.auth().signOut()
            KOSession.shared().close()
            self.dismiss(animated: true)
        } catch let error {
            print("Error signing out: \(error)")
        }
    }
}
