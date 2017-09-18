/**
 * Copyright 2015-2016 Kakao Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*!
 @header KOUser.h
 사용자 정보를 담고 있는 구조체.
 */
#import <Foundation/Foundation.h>
#import "KOUserInfo.h"

NS_ASSUME_NONNULL_BEGIN

/*!
 */
@interface KOUser : KOUserInfo

@property(nonatomic, readonly, nullable) NSString *email;
@property(nonatomic, readonly, getter=isVerifiedEmail) BOOL verifiedEmail;
@property(nonatomic, readonly, nullable) NSDictionary *properties;

/*!
 @abstract 사용자에 대한 정보를 얻는다.
 @param key 추출하고자 하는 사용자정보의 key값.
 */
- (id)propertyForKey:(NSString *)key;

+ (instancetype)responseWithDictionary:(NSDictionary *)dictionary;

@end

/*!
 프로퍼티 키 이름
 */
extern NSString *const KOUserEmailPropertyKey;
extern NSString *const KOUserIsVerifiedEmailPropertyKey;
extern NSString *const KOUserNicknamePropertyKey;
extern NSString *const KOUserProfileImagePropertyKey;
extern NSString *const KOUserThumbnailImagePropertyKey;

NS_ASSUME_NONNULL_END
