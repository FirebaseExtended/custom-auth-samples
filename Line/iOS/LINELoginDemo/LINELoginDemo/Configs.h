//
//  Configs.h
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

/* As your iOS app will access the server from a real device or a simulator, 
 * make sure that you use the network address of your local server (e.g http://192.168.1.10:8080), NOT `http://localhost:8080`
 * If you use App Engine Flex, your server address will be like https://<project-id>.appspot.com
 */
static NSString *const kValidationServerDomain = @"<your_line_token_verification_server>";
