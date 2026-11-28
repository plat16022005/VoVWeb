/**
 * Bản sao dự phòng của firestore.server.rules dùng khi Backend triển khai độc lập
 * trên Render / Railway (Root Directory = backend/) mà không truy cập được ../firestore.server.rules
 */
export const DEFAULT_SERVER_RULES = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdminOrManager() {
      return isAuthenticated()
        && 'role' in request.auth.token
        && request.auth.token.role in ['admin', 'manager', 'Admin', 'Manager'];
    }

    function areImmutableFieldsUnchanged(fields) {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(fields);
    }

    match /Users/{userId} {
      allow read: if isOwner(userId) || isAdminOrManager();
      allow write: if false;
    }

    match /{path=**}/UserData/{docId} {
      allow read: if isAdminOrManager();
    }

    match /Users/{userId}/UserData/Profile {
      allow read: if isAuthenticated();
      allow update: if isAdminOrManager();
      allow create, delete: if false;
    }

    match /Users/{userId}/UserData/{docId} {
      allow read: if isOwner(userId) || isAdminOrManager();
      allow update: if isAdminOrManager() && docId in ['Inventory', 'Equipments', 'Heroes', 'Profile'];
      allow create, delete: if false;
    }

    match /Users/{userId}/GachaHistory/{logId} {
      allow read: if isOwner(userId) || isAdminOrManager();
      allow write: if false;
    }

    match /{path=**}/ActivityLogs/{logId} {
      allow read: if isAdminOrManager();
    }

    match /Users/{userId}/ActivityLogs/{logId} {
      allow read: if isOwner(userId) || isAdminOrManager();
      allow create: if isAdminOrManager();
      allow update, delete: if false;
    }

    match /Leaderboards/{boardId} {
      allow read: if isAuthenticated();
      allow write: if false;

      match /Rankings/{rankId} {
        allow read: if isAuthenticated();
        allow write: if false;
      }
    }

    match /Guilds/{guildId} {
      allow read: if isAuthenticated();
      allow write: if false;

      match /{subCollection=**} {
        allow read: if isAuthenticated();
        allow write: if false;
      }
    }

    function isValidSystemMailRewardItem(item) {
      return item is map
        && item.keys().hasAll(['ItemId', 'Quantity'])
        && item.keys().hasOnly(['ItemId', 'ItemName', 'Quantity', 'Rarity', 'CustomEquipment'])
        && item.ItemId is string && item.ItemId.size() >= 1 && item.ItemId.size() <= 80
        && item.Quantity is int && item.Quantity >= 1 && item.Quantity <= 999999
        && (!('ItemName' in item) || (item.ItemName is string && item.ItemName.size() <= 120))
        && (!('Rarity' in item) || (item.Rarity is int && item.Rarity >= 0 && item.Rarity <= 4))
        && (!('CustomEquipment' in item) || item.CustomEquipment is map);
    }

    function isValidSystemMailRewards(rewards) {
      return rewards is map
        && rewards.keys().hasAll(['Gold', 'Gems', 'Energy', 'Items'])
        && rewards.keys().hasOnly(['Gold', 'Gems', 'Energy', 'Items'])
        && rewards.Gold is int && rewards.Gold >= 0 && rewards.Gold <= 1000000000
        && rewards.Gems is int && rewards.Gems >= 0 && rewards.Gems <= 10000000
        && rewards.Energy is int && rewards.Energy >= 0 && rewards.Energy <= 100000
        && rewards.Items is list && rewards.Items.size() <= 30
        && (rewards.Items.size() == 0
            || (isValidSystemMailRewardItem(rewards.Items[0])
                && isValidSystemMailRewardItem(rewards.Items[rewards.Items.size() - 1])));
    }

    function hasValidSystemMailCommonFields(data, mailId, dbId) {
      return mailId.size() >= 6 && mailId.size() <= 64
        && mailId.matches('^[A-Za-z0-9_-]{6,64}$')
        && data.MailId is string && data.MailId == mailId
        && data.ServerId is string && data.ServerId.size() >= 1 && data.ServerId.size() <= 64 && data.ServerId == dbId
        && data.Category is string && data.Category in ['NOTICE', 'COMPENSATION', 'REWARD', 'SUPPORT', 'EVENT']
        && data.Title is string && data.Title.size() >= 1 && data.Title.size() <= 150
        && data.Content is string && data.Content.size() >= 1 && data.Content.size() <= 4000
        && data.SenderName is string && data.SenderName.size() >= 1 && data.SenderName.size() <= 80
        && data.TargetServers is list && data.TargetServers.size() == 1
        && data.TargetServers[0] is string && data.TargetServers[0] == dbId
        && data.ReceiverName is string && data.ReceiverName.size() <= 120
        && data.ReceiverPlayerCode is string && data.ReceiverPlayerCode.size() <= 32
        && data.HasRewards is bool
        && isValidSystemMailRewards(data.Rewards)
        && data.HasRewards == (data.Rewards.Gold > 0 || data.Rewards.Gems > 0 || data.Rewards.Energy > 0 || data.Rewards.Items.size() > 0)
        && data.ReferenceTicketId is string && data.ReferenceTicketId.size() <= 64
        && data.Status is string && data.Status in ['SENT', 'REVOKED']
        && data.ExpiresAt is string && data.ExpiresAt.size() <= 64
        && data.CreatedAt is string && data.CreatedAt.size() >= 1 && data.CreatedAt.size() <= 64
        && data.UpdatedAt is string && data.UpdatedAt.size() >= 1 && data.UpdatedAt.size() <= 64
        && data.CreatedBy is string && data.CreatedBy.size() >= 1 && data.CreatedBy.size() <= 200
        && data.UpdatedBy is string && data.UpdatedBy.size() >= 1 && data.UpdatedBy.size() <= 200;
    }

    function isValidGlobalMail(data, mailId, dbId) {
      return data.keys().hasAll([
          'MailId', 'ServerId', 'Type', 'Category', 'Title', 'Content', 'SenderName',
          'TargetServers', 'ReceiverId', 'UserId', 'ReceiverName', 'ReceiverPlayerCode',
          'HasRewards', 'Rewards', 'ReferenceTicketId', 'Status', 'ExpiresAt',
          'CreatedAt', 'UpdatedAt', 'CreatedBy', 'UpdatedBy'
        ])
        && data.keys().hasOnly([
          'MailId', 'ServerId', 'Type', 'Category', 'Title', 'Content', 'SenderName',
          'TargetServers', 'ReceiverId', 'UserId', 'ReceiverName', 'ReceiverPlayerCode',
          'HasRewards', 'Rewards', 'ReferenceTicketId', 'Status', 'ExpiresAt',
          'CreatedAt', 'UpdatedAt', 'CreatedBy', 'UpdatedBy'
        ])
        && hasValidSystemMailCommonFields(data, mailId, dbId)
        && data.Type is string && data.Type == 'global'
        && data.ReceiverId is string && data.ReceiverId == ''
        && data.UserId is string && data.UserId == '';
    }

    function isValidPersonalMail(data, mailId, userId, dbId) {
      return data.keys().hasAll([
          'MailId', 'ServerId', 'Type', 'Category', 'Title', 'Content', 'SenderName',
          'TargetServers', 'ReceiverId', 'UserId', 'ReceiverName', 'ReceiverPlayerCode',
          'HasRewards', 'Rewards', 'ReferenceTicketId', 'Status',
          'IsRead', 'IsClaimed', 'ClaimedAt', 'ExpiresAt',
          'CreatedAt', 'UpdatedAt', 'CreatedBy', 'UpdatedBy'
        ])
        && data.keys().hasOnly([
          'MailId', 'ServerId', 'Type', 'Category', 'Title', 'Content', 'SenderName',
          'TargetServers', 'ReceiverId', 'UserId', 'ReceiverName', 'ReceiverPlayerCode',
          'HasRewards', 'Rewards', 'ReferenceTicketId', 'Status',
          'IsRead', 'IsClaimed', 'ClaimedAt', 'ExpiresAt',
          'CreatedAt', 'UpdatedAt', 'CreatedBy', 'UpdatedBy'
        ])
        && hasValidSystemMailCommonFields(data, mailId, dbId)
        && data.Type is string && data.Type == 'personal'
        && data.ReceiverId is string && data.ReceiverId.size() >= 1 && data.ReceiverId.size() <= 128 && data.ReceiverId == userId
        && data.UserId is string && data.UserId == userId
        && data.IsRead is bool
        && data.IsClaimed is bool
        && data.ClaimedAt is string && data.ClaimedAt.size() <= 64;
    }

    match /{path=**}/Mailbox/{mailId} {
      allow read: if isAdminOrManager();
    }

    match /Mailbox/{mailId} {
      allow read: if isAdminOrManager()
        || (
          isAuthenticated()
          && resource.data.Status == 'SENT'
          && resource.data.Type == 'global'
        );
      allow create: if isAdminOrManager()
        && isValidGlobalMail(request.resource.data, mailId, database)
        && request.resource.data.Status == 'SENT';
      allow update: if isAdminOrManager()
        && isValidGlobalMail(request.resource.data, mailId, database)
        && areImmutableFieldsUnchanged([
          'MailId', 'ServerId', 'Type', 'TargetServers',
          'ReceiverId', 'UserId', 'CreatedAt', 'CreatedBy'
        ]);
      allow delete: if isAdminOrManager();
    }

    match /Users/{userId}/Mailbox/{mailId} {
      allow read: if isAdminOrManager()
        || (
          isOwner(userId)
          && resource.data.Status == 'SENT'
        );
      allow create: if (
          isAdminOrManager()
          || (
            isOwner(userId)
            && request.resource.data.Category == 'EVENT'
            && request.resource.data.ReferenceTicketId.size() >= 1
          )
        )
        && isValidPersonalMail(request.resource.data, mailId, userId, database)
        && request.resource.data.Status == 'SENT'
        && request.resource.data.IsRead == false
        && request.resource.data.IsClaimed == false
        && request.resource.data.ClaimedAt == '';
      allow update: if isAdminOrManager()
        && isValidPersonalMail(request.resource.data, mailId, userId, database)
        && areImmutableFieldsUnchanged([
          'MailId', 'ServerId', 'Type', 'TargetServers',
          'ReceiverId', 'UserId', 'IsRead', 'IsClaimed', 'ClaimedAt',
          'CreatedAt', 'CreatedBy'
        ]);
      allow delete: if isAdminOrManager();
    }

    match /ServerConfig/Config {
      allow read: if isAuthenticated();
      allow write: if isAdminOrManager();
    }

    match /{document=**} {
      allow write: if false;
    }

  }
}
`;
