//
//  MainViewController.swift
//  KakaoLoginIOS
//
//  Created by Kevin Kang on 2017. 9. 18..
//  Copyright © 2017년 Hara Kang. All rights reserved.
//
import FirebaseAuth

class MainViewController: UIViewController {
    @IBOutlet weak var profileImageView: UIImageView!
    @IBOutlet weak var emailTextView: UITextView!
    @IBOutlet weak var displayNameTextView: UITextView!
    @IBOutlet weak var navigationBar: UINavigationBar!
    @IBOutlet weak var navigationTitleItem: UINavigationItem!
    
    override func viewDidLoad() {
        let user = Auth.auth().currentUser
        if user == nil {
            self.dismiss(animated: true, completion: {
            })
        } else {
            updateUserProfileUI(user: user!)
        }
    }
    
    /**
        Update profile UI with user information stored on Firebase (email, display name, and profile image)
    */
    func updateUserProfileUI(user: User) {
        self.emailTextView.text = String.init(format: "Email: %@", user.email!)
        self.displayNameTextView.text = String.init(format: "DisplayName: %@", user.displayName!)
        if user.photoURL != nil {
            profileImageView.sd_setImage(with: user.photoURL, placeholderImage: #imageLiteral(resourceName: "placeholder.png"), options: [], completed: { (image, error, cacheType, url) in
                if error != nil {
                    print("error in loading profile image")
                }
            })
        }
        
    }
    
    @IBAction func logoutButtonClicked(_ sender: UIButton) {
        do {
            try Auth.auth().signOut()
        } catch {
            print("Firebase logout failed")
        }
        KOSession.shared().close()
        self.dismiss(animated: true) {
        }
    }
}
