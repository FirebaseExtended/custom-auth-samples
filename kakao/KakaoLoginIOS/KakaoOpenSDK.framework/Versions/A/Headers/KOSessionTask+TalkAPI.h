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

#import "KOSessionTask.h"
#import "KOTalkProfile.h"
#import "KOChatContext.h"

#import "KOUser.h"
#import "KOChat.h"
#import "KOFriend.h"

/*!
 @header KOSessionTask+TalkAPI.h
 인증된 session 정보를 바탕으로 각종 카카오톡 API를 호출할 수 있습니다.
 */

/*!
 @abstract KOTalkMessageReceiverType (Deprecated)
 */
typedef NS_ENUM(NSInteger, KOTalkMessageReceiverType) {
    KOTalkMessageReceiverTypeUser = 0,
    KOTalkMessageReceiverTypeFriend,
    KOTalkMessageReceiverTypeChat
};

/*!
 @abstract KOTalkMessageReceiverIDType
 @constant KOTalkMessageReceiverIDTypeUUID 메시지 수신 대상의 UUID. KOUserInfo.uuid
 @constant KOTalkMessageReceiverIDTypeUser 메시지 수신 대상의 사용자 ID. KOUserInfo.ID
 @constant KOTalkMessageReceiverIDTypeChat 메시지 수신 대상 채팅방 ID. KOChat.ID
 */
typedef NS_ENUM(NSInteger, KOTalkMessageReceiverIDType) {
    KOTalkMessageReceiverIDTypeUser,
    KOTalkMessageReceiverIDTypeChat,
    KOTalkMessageReceiverIDTypeUUID,
};

/*!
 인증된 session 정보를 바탕으로 각종 카카오톡 API를 호출할 수 있습니다.
 */
@interface KOSessionTask (TalkAPI)

#pragma mark - Send Message V2

/*!
 @abstract 미리 지정된 메시지 템플릿(V2)을 사용하여, 카카오톡으로 메시지를 전송합니다. 제휴를 통해 권한이 부여된 특정 앱에서만 호출 가능합니다.
 @param templateId 전송할 메시지 템플릿 ID.
 @param templateArgs 메시지 템플릿을 완성하기 위해 필요한 추가 파라미터 정보.
 @param receiverType 메시지 수신 대상 ID의 타입.
 @param receiverId 메시지를 수신할 대상(채팅방 또는 사용자)의 ID.
 @param completionHandler 요청 완료시 실행될 block. 오류 처리와 전송 완료 시 수행된다.
 */
+ (instancetype)talkMessageSendTaskWithTemplateId:(NSString *)templateId
                                     templateArgs:(NSDictionary<NSString *, id> *)templateArgs
                                     receiverType:(KOTalkMessageReceiverIDType)receiverType
                                       receiverId:(id)receiverId
                                completionHandler:(void (^)(NSError *error))completionHandler;



#pragma mark - Send Memo V2

/*!
 @abstract 미리 지정된 메시지 템플릿(V2)을 사용하여, 카카오톡의 "나와의 채팅방"으로 메시지를 전송합니다. 모든 앱에서 호출 가능합니다.
 @param templateId 전송할 메시지 템플릿 ID.
 @param templateArgs 메시지 템플릿을 완성하기 위해 필요한 추가 파라미터 정보.
 @param completionHandler 요청 완료시 실행될 block. 오류 처리와 전송 완료 시 수행된다.
 */
+ (instancetype)talkMemoSendTaskWithTemplateId:(NSString *)templateId
                                  templateArgs:(NSDictionary<NSString *, id> *)templateArgs
                             completionHandler:(void (^)(NSError *error))completionHandler;



#pragma mark - Profile

/*!
 @abstract 현재 로그인된 사용자의 카카오톡 프로필 정보를 얻을 수 있습니다.
 @param completionHandler 카카오톡 프로필 정보를 얻어 처리하는 핸들러
 */
+ (instancetype)talkProfileTaskWithCompletionHandler:(KOSessionTaskCompletionHandler)completionHandler;

/*!
 @abstract 현재 로그인된 사용자의 카카오톡 프로필 정보를 얻을 수 있습니다.
 @param secureResource 프로필, 썸네일 이미지 등의 리소스 정보들에 대해 https를 지원하는 형식으로 응답을 받을지의 여부. YES일 경우 https지원, NO일 경우 http지원.
 @param completionHandler 카카오톡 프로필 정보를 얻어 처리하는 핸들러
 */
+ (instancetype)talkProfileTaskWithSecureResource:(BOOL)secureResource
                                completionHandler:(KOSessionTaskCompletionHandler)completionHandler;


#pragma mark - Chat List

/*!
 @abstract 카카오톡 채팅방 목록을 가져옵니다. 제휴를 통해 권한이 부여된 특정 앱에서만 호출 가능합니다.
 @param context 채팅방 목록을 불러올 때, 페이징 정보를 처리하기 위한 context.
 @param completionHandler 카카오톡 채팅방 목록을 가져와서 처리하는 핸들러.
 */
+ (instancetype)talkChatListTaskWithContext:(KOChatContext *)context
                          completionHandler:(void (^)(NSArray *chats, NSError *error))completionHandler;


#pragma mark - Deprecated

/*!
 @abstract 미리 지정된 Template Message를 사용하여, 카카오톡으로 메시지를 전송합니다. 제휴를 통해 권한이 부여된 특정 앱에서만 호출 가능합니다.
 @param templateID 미리 지정된 템플릿 메시지 ID.
 @param user 이 메시지를 수신할 User.
 @param messageArguments 템플릿 메시지를 만들 때, 채워줘야할 파라미터들.
 @param completionHandler 요청 완료시 실행될 block. 오류 처리와 전송 완료 시 수행된다.
 */
+ (instancetype)talkSendMessageTaskWithTemplateID:(NSString *)templateID
                                     receiverUser:(KOUserInfo *)user
                                 messageArguments:(NSDictionary *)messageArguments
                                completionHandler:(void (^)(NSError *error))completionHandler DEPRECATED_ATTRIBUTE;

/*!
 @abstract 미리 지정된 Template Message를 사용하여, 카카오톡으로 메시지를 전송합니다. 제휴를 통해 권한이 부여된 특정 앱에서만 호출 가능합니다.
 @param templateID 미리 지정된 템플릿 메시지 ID.
 @param receiverChat 이 메시지를 수신할 채팅방.
 @param messageArguments 템플릿 메시지를 만들 때, 채워줘야할 파라미터들.
 @param completionHandler 요청 완료시 실행될 block. 오류 처리와 전송 완료 시 수행된다.
 */
+ (instancetype)talkSendMessageTaskWithTemplateID:(NSString *)templateID
                                     receiverChat:(KOChat *)receiverChat
                                 messageArguments:(NSDictionary *)messageArguments
                                completionHandler:(void (^)(NSError *error))completionHandler DEPRECATED_ATTRIBUTE;

/*!
 @abstract 미리 지정된 Message Template을 사용하여, 카카오톡의 "나와의 채팅방"으로 메시지를 전송합니다. 모든 앱에서 호출 가능합니다.
 @param templateID 개발자 사이트를 통해 생성한 메시지 템플릿 id
 @param messageArguments 메시지 템플릿에 정의한 키/밸류의 파라미터들. 템플릿에 정의된 모든 파라미터가 포함되어야 합니다.
 @param completionHandler 요청 완료시 실행될 block. 오류 처리와 전송 완료 시 수행된다.
 */
+ (instancetype)talkSendMemoTaskWithTemplateID:(NSString *)templateID
                              messageArguments:(NSDictionary *)messageArguments
                             completionHandler:(void (^)(NSError *error))completionHandler DEPRECATED_ATTRIBUTE;


@end
