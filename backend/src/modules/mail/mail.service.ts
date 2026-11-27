import crypto from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FirestoreBatchWrite,
  GachaFirebaseService,
} from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import {
  MailActivityLog,
  MailLogAction,
  MailPlayerSearchItem,
  MailReferenceItem,
  MailReferenceServer,
  MailReferencesResponse,
  SystemMailCategory,
  SystemMailDocument,
  SystemMailRewardItem,
  SystemMailRewards,
  SystemMailStatus,
  SystemMailType,
} from './mail.types.js';

const MAILBOX_COLLECTION = 'Mailbox';
const USERS_COLLECTION = 'Users';
const ITEM_CONFIGS_COLLECTION = 'ItemConfigs';
const SERVER_LIST_DOC_PATH = 'GameConfig/ServerList';
const MAIL_LOGS_PARENT_PATH = 'Logs/Mailbox';
const MAIL_LOGS_COLLECTION_PATH = 'Logs/Mailbox/Activities';

const VALID_MAIL_ID_REGEX = /^[A-Za-z0-9_-]{6,64}$/;
const VALID_ITEM_ID_REGEX = /^[A-Za-z0-9_-]{1,80}$/;
const VALID_SERVER_ID_REGEX = /^[a-z0-9-]+$/;

const VALID_CATEGORIES: readonly SystemMailCategory[] = [
  'NOTICE',
  'COMPENSATION',
  'REWARD',
  'SUPPORT',
  'EVENT',
] as const;

const CATEGORY_LABELS: Record<SystemMailCategory, string> = {
  NOTICE: 'Thông Báo',
  COMPENSATION: 'Đền Bù Lỗi',
  REWARD: 'Quà Tặng',
  SUPPORT: 'Hỗ Trợ Cá Nhân',
  EVENT: 'Sự Kiện',
};

function formatOperatorLabel(operator: AuthenticatedOperator): string {
  return operator.email || operator.username || 'system';
}

function formatSafeCreatorLabel(operator: AuthenticatedOperator): string {
  return operator.username?.trim() || 'Đội Hỗ Trợ Veyra';
}

function clampInt(
  val: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(num)));
}

function parseCategory(raw: unknown): SystemMailCategory {
  if (typeof raw === 'string') {
    const upper = raw.trim().toUpperCase() as SystemMailCategory;
    if (VALID_CATEGORIES.includes(upper)) return upper;
  }
  return 'NOTICE';
}

function parseIsoOrDefaultExpiry(val: unknown): string {
  if (typeof val === 'string' && val.trim()) {
    const d = new Date(val.trim());
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(
        'Thời gian hết hạn thư không đúng định dạng hợp lệ.',
      );
    }
    return d.toISOString();
  }
  // Mặc định thư lưu trữ 30 ngày
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function generateMailId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `mail_${datePart}_${randomPart}`;
}

function summarizeRewards(rewards: SystemMailRewards): string {
  const parts: string[] = [];
  if (rewards.Gold > 0) {
    parts.push(`${rewards.Gold.toLocaleString('vi-VN')} Vàng`);
  }
  if (rewards.Gems > 0) {
    parts.push(`${rewards.Gems.toLocaleString('vi-VN')} Ngọc`);
  }
  if (rewards.Energy > 0) {
    parts.push(`${rewards.Energy.toLocaleString('vi-VN')} Thể Lực`);
  }
  if (rewards.Items.length > 0) {
    parts.push(
      rewards.Items.map(
        (it) => `${it.ItemName || it.ItemId} x${it.Quantity}`,
      ).join(', '),
    );
  }
  return parts.length > 0 ? parts.join(' · ') : 'Không đính kèm quà';
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly firebase: GachaFirebaseService) {}

  private assertValidMailId(rawId: unknown): string {
    const trimmed = typeof rawId === 'string' ? rawId.trim() : '';
    if (!VALID_MAIL_ID_REGEX.test(trimmed)) {
      throw new BadRequestException('Mã thư hệ thống không hợp lệ.');
    }
    return trimmed;
  }

  private assertValidServerId(rawId: unknown): string {
    const trimmed = typeof rawId === 'string' ? rawId.trim().toLowerCase() : '';
    if (
      !trimmed ||
      trimmed === 'default' ||
      trimmed === '(default)' ||
      trimmed === 'all' ||
      !VALID_SERVER_ID_REGEX.test(trimmed)
    ) {
      throw new BadRequestException(
        'Vui lòng chỉ định đúng mã cụm máy chủ cụ thể (ví dụ: server-1, server-2).',
      );
    }
    return trimmed;
  }

  private async getRegisteredServers(
    token: string,
  ): Promise<MailReferenceServer[]> {
    const serverDoc = await this.firebase
      .getDocument(SERVER_LIST_DOC_PATH, token)
      .catch(() => null);
    const servers: MailReferenceServer[] = [];
    if (serverDoc) {
      const obj = this.firebase.docToObject(serverDoc);
      for (const [serverId, value] of Object.entries(obj)) {
        const cleanId = serverId.trim().toLowerCase();
        if (
          !cleanId ||
          cleanId === 'default' ||
          cleanId === '(default)' ||
          !VALID_SERVER_ID_REGEX.test(cleanId)
        ) {
          continue;
        }
        if (!value || typeof value !== 'object') continue;
        const rec = value as Record<string, unknown>;
        const name =
          typeof rec.Name === 'string' && rec.Name.trim()
            ? rec.Name.trim()
            : cleanId;
        const status =
          typeof rec.Status === 'string' && rec.Status.trim()
            ? rec.Status.trim()
            : 'Normal';
        servers.push({ ServerId: cleanId, Name: name, Status: status });
      }
      servers.sort((a, b) => a.ServerId.localeCompare(b.ServerId));
    }
    return servers;
  }

  private async assertRegisteredServer(
    rawServerId: unknown,
    token: string,
  ): Promise<MailReferenceServer> {
    const serverId = this.assertValidServerId(rawServerId);
    const servers = await this.getRegisteredServers(token);
    const matched = servers.find((s) => s.ServerId === serverId);
    if (!matched) {
      throw new BadRequestException(
        `Cụm máy chủ "${serverId}" chưa được đăng ký trong danh sách máy chủ hoạt động.`,
      );
    }
    return matched;
  }

  private wrapShardError(serverId: string, err: unknown): never {
    if (
      err instanceof BadRequestException ||
      err instanceof ForbiddenException ||
      err instanceof NotFoundException
    ) {
      throw err;
    }
    const rawMsg = err instanceof Error ? err.message : String(err);
    const lower = rawMsg.toLowerCase();
    if (
      lower.includes('missing or insufficient permissions') ||
      lower.includes('permission_denied') ||
      lower.includes('403')
    ) {
      throw new ForbiddenException(
        `Không đủ quyền truy cập hòm thư trên máy chủ "${serverId}". Vui lòng đăng xuất rồi đăng nhập lại để làm mới quyền quản trị, hoặc kiểm tra quy tắc bảo mật của máy chủ này.`,
      );
    }
    if (lower.includes('database') && lower.includes('not found')) {
      throw new NotFoundException(
        `Máy chủ "${serverId}" chưa được khởi tạo vùng dữ liệu riêng trên hệ thống.`,
      );
    }
    throw err instanceof Error ? err : new Error(rawMsg);
  }

  private hasSubPermission(
    operator: AuthenticatedOperator,
    perm: string,
  ): boolean {
    if (operator.role === 'Admin') return true;
    return operator.permissions.includes(perm);
  }

  private normalizeRewards(raw: unknown): SystemMailRewards {
    const obj =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const gold = clampInt(obj.Gold, 0, 1000000000, 0);
    const gems = clampInt(obj.Gems, 0, 10000000, 0);
    const energy = clampInt(obj.Energy, 0, 100000, 0);

    const rawItems = Array.isArray(obj.Items) ? obj.Items : [];
    const items: SystemMailRewardItem[] = [];
    for (const entry of rawItems) {
      if (!entry || typeof entry !== 'object') continue;
      const rec = entry as Record<string, unknown>;
      const itemId = typeof rec.ItemId === 'string' ? rec.ItemId.trim() : '';
      if (!itemId) continue;
      const itemName =
        typeof rec.ItemName === 'string' && rec.ItemName.trim()
          ? rec.ItemName.trim().slice(0, 120)
          : itemId;
      const quantity = clampInt(rec.Quantity, 1, 999999, 1);
      const rarity = clampInt(rec.Rarity, 0, 4, 0);
      items.push({
        ItemId: itemId,
        ItemName: itemName,
        Quantity: quantity,
        Rarity: rarity,
      });
    }

    return { Gold: gold, Gems: gems, Energy: energy, Items: items };
  }

  private parseUserIdFromDocName(docName: string): string {
    const match = docName.match(/\/documents\/Users\/([^/]+)\/Mailbox\/[^/]+$/);
    return match ? match[1] : '';
  }

  private resolveMailDocPath(mailId: string, receiverId?: string): string {
    const cleanUid = (receiverId || '').trim();
    if (cleanUid) {
      if (cleanUid.includes('/') || cleanUid.length > 128) {
        throw new BadRequestException('Định danh người nhận thư không hợp lệ.');
      }
      return `${USERS_COLLECTION}/${cleanUid}/${MAILBOX_COLLECTION}/${mailId}`;
    }
    return `${MAILBOX_COLLECTION}/${mailId}`;
  }

  private normalizeMailDocument(
    docId: string,
    raw: Record<string, unknown>,
    shardServerId: string,
    userIdFromPath = '',
  ): SystemMailDocument {
    const mailId =
      (typeof raw.MailId === 'string' && raw.MailId.trim()) || docId;
    const serverId =
      (typeof raw.ServerId === 'string' && raw.ServerId.trim()) || shardServerId;
    const type: SystemMailType = userIdFromPath
      ? 'personal'
      : raw.Type === 'personal'
        ? 'personal'
        : 'global';
    const category = parseCategory(raw.Category);
    const title =
      (typeof raw.Title === 'string' && raw.Title.trim()) || mailId;
    const content = typeof raw.Content === 'string' ? raw.Content : '';
    const senderName =
      (typeof raw.SenderName === 'string' && raw.SenderName.trim()) ||
      'Hội Đồng Veyra';

    const targetServers = [serverId];

    const receiverId =
      userIdFromPath ||
      (typeof raw.ReceiverId === 'string'
        ? raw.ReceiverId.trim()
        : typeof raw.UserId === 'string'
          ? raw.UserId.trim()
          : '');
    const receiverName =
      typeof raw.ReceiverName === 'string' ? raw.ReceiverName.trim() : '';
    const receiverPlayerCode =
      typeof raw.ReceiverPlayerCode === 'string'
        ? raw.ReceiverPlayerCode.trim()
        : '';

    const rewards = this.normalizeRewards(raw.Rewards);
    const hasRewards =
      rewards.Gold > 0 ||
      rewards.Gems > 0 ||
      rewards.Energy > 0 ||
      rewards.Items.length > 0;

    const referenceTicketId =
      typeof raw.ReferenceTicketId === 'string'
        ? raw.ReferenceTicketId.trim()
        : '';
    const status: SystemMailStatus =
      raw.Status === 'REVOKED' ? 'REVOKED' : 'SENT';
    const expiresAt =
      typeof raw.ExpiresAt === 'string' ? raw.ExpiresAt.trim() : '';
    const createdAt =
      typeof raw.CreatedAt === 'string' && raw.CreatedAt.trim()
        ? raw.CreatedAt.trim()
        : new Date().toISOString();
    const updatedAt =
      typeof raw.UpdatedAt === 'string' && raw.UpdatedAt.trim()
        ? raw.UpdatedAt.trim()
        : createdAt;
    const createdBy =
      typeof raw.CreatedBy === 'string' && raw.CreatedBy.trim()
        ? raw.CreatedBy.trim()
        : 'Đội Hỗ Trợ Veyra';
    const updatedBy =
      typeof raw.UpdatedBy === 'string' && raw.UpdatedBy.trim()
        ? raw.UpdatedBy.trim()
        : createdBy;

    const base: SystemMailDocument = {
      MailId: mailId,
      ServerId: serverId,
      Type: type,
      Category: category,
      Title: title,
      Content: content,
      SenderName: senderName,
      TargetServers: targetServers,
      ReceiverId: type === 'personal' ? receiverId : '',
      UserId: type === 'personal' ? receiverId : '',
      ReceiverName: receiverName,
      ReceiverPlayerCode: receiverPlayerCode,
      HasRewards: hasRewards,
      Rewards: rewards,
      ReferenceTicketId: referenceTicketId,
      Status: status,
      ExpiresAt: expiresAt,
      CreatedAt: createdAt,
      UpdatedAt: updatedAt,
      CreatedBy: createdBy,
      UpdatedBy: updatedBy,
    };

    if (type === 'personal') {
      return {
        ...base,
        IsRead: raw.IsRead === true,
        IsClaimed: raw.IsClaimed === true,
        ClaimedAt:
          typeof raw.ClaimedAt === 'string' ? raw.ClaimedAt.trim() : '',
      };
    }

    return base;
  }

  private validateRewardsPayload(raw: unknown): {
    rewards: SystemMailRewards;
    hasRewards: boolean;
  } {
    const obj =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const gold = clampInt(obj.Gold, 0, 1000000000, 0);
    const gems = clampInt(obj.Gems, 0, 10000000, 0);
    const energy = clampInt(obj.Energy, 0, 100000, 0);

    const rawItems = Array.isArray(obj.Items) ? obj.Items : [];
    if (rawItems.length > 30) {
      throw new BadRequestException(
        'Mỗi thư chỉ hỗ trợ đính kèm tối đa 30 loại vật phẩm.',
      );
    }

    const itemMap = new Map<string, SystemMailRewardItem>();
    for (const entry of rawItems) {
      if (!entry || typeof entry !== 'object') continue;
      const rec = entry as Record<string, unknown>;
      const itemId = typeof rec.ItemId === 'string' ? rec.ItemId.trim() : '';
      if (!itemId) continue;
      if (!VALID_ITEM_ID_REGEX.test(itemId)) {
        throw new BadRequestException(
          `Mã vật phẩm "${itemId}" không đúng định dạng hợp lệ.`,
        );
      }
      const quantity = clampInt(rec.Quantity, 1, 999999, 0);
      if (quantity <= 0) {
        throw new BadRequestException(
          `Số lượng của vật phẩm "${itemId}" phải lớn hơn 0.`,
        );
      }
      const itemName =
        typeof rec.ItemName === 'string' && rec.ItemName.trim()
          ? rec.ItemName.trim().slice(0, 120)
          : itemId;
      const rarity = clampInt(rec.Rarity, 0, 4, 0);

      const prev = itemMap.get(itemId);
      if (prev) {
        prev.Quantity = Math.min(999999, prev.Quantity + quantity);
      } else {
        itemMap.set(itemId, {
          ItemId: itemId,
          ItemName: itemName,
          Quantity: quantity,
          Rarity: rarity,
        });
      }
    }

    const items = Array.from(itemMap.values());
    const hasRewards = gold > 0 || gems > 0 || energy > 0 || items.length > 0;
    return {
      rewards: { Gold: gold, Gems: gems, Energy: energy, Items: items },
      hasRewards,
    };
  }

  private async logMailActivity(
    operator: AuthenticatedOperator,
    payload: {
      action: MailLogAction;
      actionTitle: string;
      mailId: string;
      mailType: SystemMailType;
      category: SystemMailCategory;
      title: string;
      targetSummary: string;
      hasRewards: boolean;
      details: string;
    },
  ): Promise<void> {
    const now = Date.now();
    const record: Record<string, unknown> = {
      action: payload.action,
      actionTitle: payload.actionTitle,
      mailId: payload.mailId,
      mailType: payload.mailType,
      category: payload.category,
      title: payload.title,
      targetSummary: payload.targetSummary,
      hasRewards: payload.hasRewards,
      details: payload.details,
      performedBy: formatOperatorLabel(operator),
      performedByRole: operator.role,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
    };

    try {
      await this.firebase.createDocument(
        MAIL_LOGS_COLLECTION_PATH,
        null,
        record,
        operator.authTokenForFirestore,
      );
    } catch (err) {
      this.logger.warn(
        `Không thể ghi nhật ký Hòm Thư (${payload.action}): ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  // ==================== READ & REFERENCES ====================

  private async listMailsOnShard(
    serverId: string,
    token: string,
  ): Promise<SystemMailDocument[]> {
    // Collection group query trên 1 shard: lấy đồng thời cả
    // 1) Mailbox/{mailId} (thư toàn server)
    // 2) Users/{uid}/Mailbox/{mailId} (thư cá nhân từng người chơi)
    const docs = await this.firebase.runQuery(
      '',
      {
        from: [{ collectionId: MAILBOX_COLLECTION, allDescendants: true }],
      },
      token,
      serverId,
    );

    return docs.map((doc) =>
      this.normalizeMailDocument(
        this.firebase.extractDocId(doc.name),
        this.firebase.docToObject(doc),
        serverId,
        this.parseUserIdFromDocName(doc.name),
      ),
    );
  }

  async getAllMails(
    operator: AuthenticatedOperator,
    rawFilterServerId?: string,
  ): Promise<SystemMailDocument[]> {
    const cleanFilter = (rawFilterServerId || '').trim().toLowerCase();

    if (cleanFilter && cleanFilter !== 'all') {
      const srv = await this.assertRegisteredServer(
        cleanFilter,
        operator.authTokenForFirestore,
      );
      try {
        const list = await this.listMailsOnShard(
          srv.ServerId,
          operator.authTokenForFirestore,
        );
        return list.sort((a, b) => {
          const tA = new Date(a.CreatedAt).getTime() || 0;
          const tB = new Date(b.CreatedAt).getTime() || 0;
          return tB - tA;
        });
      } catch (err) {
        this.wrapShardError(srv.ServerId, err);
      }
    }

    const servers = await this.getRegisteredServers(
      operator.authTokenForFirestore,
    );
    if (servers.length === 0) return [];

    const settled = await Promise.allSettled(
      servers.map((srv) =>
        this.listMailsOnShard(srv.ServerId, operator.authTokenForFirestore),
      ),
    );

    const list: SystemMailDocument[] = [];
    let firstFailure: { serverId: string; reason: unknown } | null = null;
    let successCount = 0;

    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i];
      const srv = servers[i];
      if (outcome.status === 'fulfilled') {
        successCount++;
        list.push(...outcome.value);
      } else {
        if (!firstFailure) {
          firstFailure = { serverId: srv.ServerId, reason: outcome.reason };
        }
        this.logger.warn(
          `Không thể đọc hòm thư trên cụm máy chủ ${srv.ServerId}: ${
            outcome.reason instanceof Error
              ? outcome.reason.message
              : String(outcome.reason)
          }`,
        );
      }
    }

    if (successCount === 0 && firstFailure) {
      this.wrapShardError(firstFailure.serverId, firstFailure.reason);
    }

    return list.sort((a, b) => {
      const tA = new Date(a.CreatedAt).getTime() || 0;
      const tB = new Date(b.CreatedAt).getTime() || 0;
      return tB - tA;
    });
  }

  async getReferences(
    operator: AuthenticatedOperator,
  ): Promise<MailReferencesResponse> {
    const [itemDocs, servers] = await Promise.all([
      this.firebase
        .listDocuments(ITEM_CONFIGS_COLLECTION, operator.authTokenForFirestore)
        .catch(() => []),
      this.getRegisteredServers(operator.authTokenForFirestore),
    ]);

    const items: MailReferenceItem[] = itemDocs
      .map((doc) => {
        const id = this.firebase.extractDocId(doc.name);
        const obj = this.firebase.docToObject(doc);
        const itemId =
          (typeof obj.ItemId === 'string' && obj.ItemId.trim()) || id;
        const itemName =
          (typeof obj.ItemName === 'string' && obj.ItemName.trim()) ||
          (typeof obj.Name === 'string' && obj.Name.trim()) ||
          itemId;
        const type = clampInt(obj.Type ?? obj.ItemType, 0, 4, 1);
        const rarity = clampInt(obj.Rarity, 0, 4, 0);
        const iconUrl =
          (typeof obj.IconUrl === 'string' && obj.IconUrl.trim()) ||
          (typeof obj.ImageUrl === 'string' && obj.ImageUrl.trim()) ||
          undefined;
        return {
          ItemId: itemId,
          ItemName: itemName,
          Type: type,
          Rarity: rarity,
          ...(iconUrl ? { IconUrl: iconUrl } : {}),
        };
      })
      .sort((a, b) => {
        if (b.Rarity !== a.Rarity) return b.Rarity - a.Rarity;
        if (a.Type !== b.Type) return a.Type - b.Type;
        return a.ItemName.localeCompare(b.ItemName, 'vi');
      });

    return { items, servers };
  }

  async searchPlayers(
    operator: AuthenticatedOperator,
    rawQuery: string,
    rawServerId = '',
    includeAll = false,
  ): Promise<MailPlayerSearchItem[]> {
    const q = (rawQuery || '').trim().toLowerCase();
    const targetServer = (rawServerId || '').trim().toLowerCase();
    const docs = await this.firebase.listDocuments(
      USERS_COLLECTION,
      operator.authTokenForFirestore,
    );

    const results: MailPlayerSearchItem[] = [];
    for (const doc of docs) {
      const uid = this.firebase.extractDocId(doc.name);
      const obj = this.firebase.docToObject(doc);
      const username =
        typeof obj.Username === 'string' && obj.Username.trim()
          ? obj.Username.trim()
          : typeof obj.username === 'string' && obj.username.trim()
            ? obj.username.trim()
            : uid.slice(0, 12);
      const email =
        typeof obj.Email === 'string'
          ? obj.Email.trim()
          : typeof obj.email === 'string'
            ? obj.email.trim()
            : '';
      const playerCode =
        typeof obj.PlayerCode === 'string' || typeof obj.PlayerCode === 'number'
          ? String(obj.PlayerCode).trim()
          : '';
      const lastServerId =
        typeof obj.LastServerId === 'string' ? obj.LastServerId.trim() : '';
      const role =
        typeof obj.Role === 'string' && obj.Role.trim()
          ? obj.Role.trim()
          : 'Player';

      const serverCharsRaw =
        obj.ServerCharacters && typeof obj.ServerCharacters === 'object'
          ? (obj.ServerCharacters as Record<string, unknown>)
          : {};
      const serverList = Object.keys(serverCharsRaw).filter(Boolean);
      if (lastServerId && !serverList.includes(lastServerId)) {
        serverList.push(lastServerId);
      }

      let inGameName: string | undefined;
      let characterLevel: number | undefined;
      let hasCharacterInServer = false;

      if (targetServer && targetServer !== 'ALL') {
        const charEntry = serverCharsRaw[targetServer];
        if (charEntry && typeof charEntry === 'object') {
          const rec = charEntry as Record<string, unknown>;
          hasCharacterInServer = true;
          if (typeof rec.Name === 'string' && rec.Name.trim()) {
            inGameName = rec.Name.trim();
          }
          if (typeof rec.Level === 'number' && Number.isFinite(rec.Level)) {
            characterLevel = Math.trunc(rec.Level);
          }
        } else if (lastServerId === targetServer) {
          hasCharacterInServer = true;
        }

        if (!includeAll && !hasCharacterInServer) {
          continue;
        }
      }

      if (q) {
        const matched =
          uid.toLowerCase().includes(q) ||
          username.toLowerCase().includes(q) ||
          playerCode.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          (inGameName ? inGameName.toLowerCase().includes(q) : false);
        if (!matched) continue;
      }

      results.push({
        uid,
        username,
        playerCode,
        lastServerId,
        role,
        ...(inGameName ? { inGameName } : {}),
        ...(characterLevel !== undefined ? { characterLevel } : {}),
        hasCharacterInServer,
        servers: serverList,
      });

      if (results.length >= 30) break;
    }

    return results.sort((a, b) => {
      if (Boolean(b.hasCharacterInServer) !== Boolean(a.hasCharacterInServer)) {
        return b.hasCharacterInServer ? 1 : -1;
      }
      return (a.inGameName || a.username).localeCompare(
        b.inGameName || b.username,
        'vi',
      );
    });
  }

  // ==================== SEND / REVOKE / DELETE ====================

  async sendMail(
    operator: AuthenticatedOperator,
    rawBody: Record<string, unknown>,
  ): Promise<{ sentCount: number; mails: SystemMailDocument[] }> {
    const type: SystemMailType =
      rawBody.Type === 'personal' ? 'personal' : 'global';
    const category = parseCategory(rawBody.Category);

    const title =
      typeof rawBody.Title === 'string' ? rawBody.Title.trim() : '';
    if (!title || title.length > 150) {
      throw new BadRequestException(
        'Tiêu đề thư không được để trống và tối đa 150 ký tự.',
      );
    }

    const content =
      typeof rawBody.Content === 'string' ? rawBody.Content.trim() : '';
    if (!content || content.length > 4000) {
      throw new BadRequestException(
        'Nội dung thư không được để trống và tối đa 4000 ký tự.',
      );
    }

    const senderName =
      typeof rawBody.SenderName === 'string' && rawBody.SenderName.trim()
        ? rawBody.SenderName.trim().slice(0, 80)
        : 'Hội Đồng Veyra';

    const referenceTicketId =
      typeof rawBody.ReferenceTicketId === 'string'
        ? rawBody.ReferenceTicketId.trim().slice(0, 64)
        : '';

    const rawServers = Array.isArray(rawBody.TargetServers)
      ? rawBody.TargetServers
          .map((s) =>
            typeof s === 'string' ? s.trim().toLowerCase().slice(0, 64) : '',
          )
          .filter(Boolean)
      : [];
    const dedupServers = Array.from(new Set(rawServers)).slice(0, 50);

    const registeredServers = await this.getRegisteredServers(
      operator.authTokenForFirestore,
    );
    const registeredIds = new Set(registeredServers.map((s) => s.ServerId));

    let targetShardIds: string[];
    if (type === 'personal') {
      const explicitServer =
        typeof rawBody.ServerId === 'string'
          ? rawBody.ServerId.trim().toLowerCase()
          : '';
      const specificServers = explicitServer
        ? [explicitServer]
        : dedupServers.filter((s) => s !== 'all');
      if (specificServers.length !== 1) {
        throw new BadRequestException(
          'Thư cá nhân / xử lý lỗi người chơi bắt buộc phải chỉ định đúng 1 cụm máy chủ cụ thể (không gửi chung Tất cả máy chủ).',
        );
      }
      const chosenServer = this.assertValidServerId(specificServers[0]);
      if (!registeredIds.has(chosenServer)) {
        throw new BadRequestException(
          `Cụm máy chủ "${chosenServer}" chưa được đăng ký trong hệ thống.`,
        );
      }
      targetShardIds = [chosenServer];
    } else {
      const isAll =
        dedupServers.length === 0 || dedupServers.includes('all');
      if (isAll) {
        targetShardIds = registeredServers.map((s) => s.ServerId);
        if (targetShardIds.length === 0) {
          throw new BadRequestException(
            'Chưa có cụm máy chủ nào được đăng ký để phát thư toàn server.',
          );
        }
      } else {
        targetShardIds = dedupServers.map((s) => this.assertValidServerId(s));
        for (const sid of targetShardIds) {
          if (!registeredIds.has(sid)) {
            throw new BadRequestException(
              `Cụm máy chủ "${sid}" chưa được đăng ký trong hệ thống.`,
            );
          }
        }
      }
    }

    const expiresAt = parseIsoOrDefaultExpiry(rawBody.ExpiresAt);
    const { rewards, hasRewards } = this.validateRewardsPayload(rawBody.Rewards);

    // Kiểm soát phân quyền chi tiết ở tầng Backend (Rule 8 & Rule 10)
    if (type === 'global' && hasRewards) {
      if (!this.hasSubPermission(operator, 'support.mail.send_global_reward')) {
        throw new ForbiddenException(
          'Tài khoản của bạn không có quyền "Gửi Thư Toàn Server Kèm Quà Tặng".',
        );
      }
    } else if (type === 'personal' && hasRewards) {
      if (!this.hasSubPermission(operator, 'support.mail.send_personal')) {
        throw new ForbiddenException(
          'Tài khoản của bạn không có quyền "Gửi Thư Cá Nhân Kèm Quà / Đền Bù Lỗi".',
        );
      }
    } else {
      const canNotice =
        this.hasSubPermission(operator, 'support.mail.send_notice') ||
        this.hasSubPermission(operator, 'support.mail.send_personal') ||
        this.hasSubPermission(operator, 'support.mail.send_global_reward');
      if (!canNotice) {
        throw new ForbiddenException(
          'Tài khoản của bạn không có quyền gửi thư thông báo hệ thống.',
        );
      }
    }

    const nowIso = new Date().toISOString();
    const creatorLabel = formatSafeCreatorLabel(operator);

    if (type === 'global') {
      const createdMails: SystemMailDocument[] = [];

      for (const shardId of targetShardIds) {
        const mailId = generateMailId();
        const mailDoc: SystemMailDocument = {
          MailId: mailId,
          ServerId: shardId,
          Type: 'global',
          Category: category,
          Title: title,
          Content: content,
          SenderName: senderName,
          TargetServers: [shardId],
          ReceiverId: '',
          UserId: '',
          ReceiverName: '',
          ReceiverPlayerCode: '',
          HasRewards: hasRewards,
          Rewards: rewards,
          ReferenceTicketId: referenceTicketId,
          Status: 'SENT',
          ExpiresAt: expiresAt,
          CreatedAt: nowIso,
          UpdatedAt: nowIso,
          CreatedBy: creatorLabel,
          UpdatedBy: creatorLabel,
        };

        try {
          await this.firebase.createDocument(
            MAILBOX_COLLECTION,
            mailId,
            mailDoc as unknown as Record<string, unknown>,
            operator.authTokenForFirestore,
            shardId,
          );
        } catch (err) {
          this.wrapShardError(shardId, err);
        }

        createdMails.push(mailDoc);
      }

      const srvLabel = targetShardIds.join(', ');
      const firstGlobal = createdMails[0];

      await this.logMailActivity(operator, {
        action: 'SEND_GLOBAL_MAIL',
        actionTitle:
          createdMails.length > 1
            ? `Gửi thư toàn server (${createdMails.length} cụm máy chủ)`
            : `Gửi thư toàn server (${firstGlobal.ServerId})`,
        mailId: firstGlobal.MailId,
        mailType: 'global',
        category,
        title,
        targetSummary: srvLabel,
        hasRewards,
        details: `Gửi thư toàn server [${CATEGORY_LABELS[category]}] trực tiếp vào hòm thư các cụm [${srvLabel}]${referenceTicketId ? ` (Mã phiếu: ${referenceTicketId})` : ''} — ${summarizeRewards(rewards)}.`,
      });

      return { sentCount: createdMails.length, mails: createdMails };
    }

    // Personal mail: hỗ trợ gửi cho 1 hoặc tối đa 20 người chơi cụ thể trên đúng 1 cụm server shard
    const rawRecipients = Array.isArray(rawBody.Recipients)
      ? rawBody.Recipients
      : rawBody.ReceiverId
        ? [
            {
              uid: rawBody.ReceiverId,
              username: rawBody.ReceiverName || '',
              playerCode: rawBody.ReceiverPlayerCode || '',
            },
          ]
        : [];

    const recipientMap = new Map<
      string,
      { uid: string; username: string; playerCode: string }
    >();
    for (const entry of rawRecipients) {
      if (!entry || typeof entry !== 'object') continue;
      const rec = entry as Record<string, unknown>;
      const uid = typeof rec.uid === 'string' ? rec.uid.trim() : '';
      if (!uid || uid.length > 128) continue;
      if (!recipientMap.has(uid)) {
        recipientMap.set(uid, {
          uid,
          username:
            typeof rec.username === 'string'
              ? rec.username.trim().slice(0, 120)
              : '',
          playerCode:
            typeof rec.playerCode === 'string'
              ? rec.playerCode.trim().slice(0, 32)
              : '',
        });
      }
    }

    const recipients = Array.from(recipientMap.values());
    if (recipients.length === 0) {
      throw new BadRequestException(
        'Vui lòng chọn ít nhất 1 tài khoản người chơi nhận thư cá nhân.',
      );
    }
    if (recipients.length > 20) {
      throw new BadRequestException(
        'Mỗi lượt gửi thư cá nhân hỗ trợ tối đa 20 người chơi.',
      );
    }

    // Đối chiếu hồ sơ Users (default) và Profile nhân vật trực tiếp trên shard database của server
    const personalServerId = targetShardIds[0];
    const resolvedRecipients: Array<{
      uid: string;
      username: string;
      playerCode: string;
    }> = [];
    for (const r of recipients) {
      const [userDoc, shardProfileDoc] = await Promise.all([
        this.firebase
          .getDocument(
            `${USERS_COLLECTION}/${r.uid}`,
            operator.authTokenForFirestore,
          )
          .catch(() => null),
        this.firebase
          .getDocument(
            `${USERS_COLLECTION}/${r.uid}/UserData/Profile`,
            operator.authTokenForFirestore,
            personalServerId,
          )
          .catch(() => null),
      ]);
      if (!userDoc) {
        throw new NotFoundException(
          `Không tìm thấy tài khoản người chơi với định danh "${r.uid}".`,
        );
      }
      const userObj = this.firebase.docToObject(userDoc);
      const shardProfileObj = shardProfileDoc
        ? this.firebase.docToObject(shardProfileDoc)
        : null;
      const shardInGameName =
        shardProfileObj &&
        typeof shardProfileObj.InGameName === 'string' &&
        shardProfileObj.InGameName.trim()
          ? shardProfileObj.InGameName.trim()
          : '';
      const serverChars =
        userObj.ServerCharacters && typeof userObj.ServerCharacters === 'object'
          ? (userObj.ServerCharacters as Record<string, unknown>)
          : {};
      const serverCharEntry = serverChars[personalServerId];
      const serverCharName =
        serverCharEntry &&
        typeof serverCharEntry === 'object' &&
        typeof (serverCharEntry as Record<string, unknown>).Name === 'string'
          ? String((serverCharEntry as Record<string, unknown>).Name).trim()
          : '';
      const resolvedName =
        shardInGameName ||
        serverCharName ||
        (typeof userObj.Username === 'string' && userObj.Username.trim()) ||
        r.username ||
        r.uid.slice(0, 12);
      const resolvedCode =
        typeof userObj.PlayerCode === 'string' ||
        typeof userObj.PlayerCode === 'number'
          ? String(userObj.PlayerCode).trim()
          : r.playerCode;
      resolvedRecipients.push({
        uid: r.uid,
        username: resolvedName.slice(0, 120),
        playerCode: resolvedCode.slice(0, 32),
      });
    }

    const mailsToCreate: SystemMailDocument[] = resolvedRecipients.map((r) => {
      const mailId = generateMailId();
      return {
        MailId: mailId,
        ServerId: personalServerId,
        Type: 'personal',
        Category: category,
        Title: title,
        Content: content,
        SenderName: senderName,
        TargetServers: [personalServerId],
        ReceiverId: r.uid,
        UserId: r.uid,
        ReceiverName: r.username,
        ReceiverPlayerCode: r.playerCode,
        HasRewards: hasRewards,
        Rewards: rewards,
        ReferenceTicketId: referenceTicketId,
        Status: 'SENT',
        IsRead: false,
        IsClaimed: false,
        ClaimedAt: '',
        ExpiresAt: expiresAt,
        CreatedAt: nowIso,
        UpdatedAt: nowIso,
        CreatedBy: creatorLabel,
        UpdatedBy: creatorLabel,
      };
    });

    // Mô hình Hybrid: thư cá nhân ghi trực tiếp vào Users/{uid}/Mailbox/{mailId} trong database server-x
    const writes: FirestoreBatchWrite[] = mailsToCreate.map((mailDoc) => ({
      update: {
        name: this.firebase.fullDocumentName(
          `${USERS_COLLECTION}/${mailDoc.ReceiverId}/${MAILBOX_COLLECTION}/${mailDoc.MailId}`,
          personalServerId,
        ),
        fields: this.firebase.objectToFields(
          mailDoc as unknown as Record<string, unknown>,
        ),
      },
    }));

    try {
      await this.firebase.commitWrites(
        writes,
        operator.authTokenForFirestore,
        personalServerId,
      );
    } catch (err) {
      this.wrapShardError(personalServerId, err);
    }

    const isBulk = mailsToCreate.length > 1;
    const first = mailsToCreate[0];
    const targetSummary = isBulk
      ? `${mailsToCreate.length} người chơi @ ${personalServerId} (${resolvedRecipients
          .slice(0, 3)
          .map((r) => r.username)
          .join(', ')}${mailsToCreate.length > 3 ? '...' : ''})`
      : `${first.ReceiverName}${first.ReceiverPlayerCode ? ` (#${first.ReceiverPlayerCode})` : ''} @ ${personalServerId}`;

    await this.logMailActivity(operator, {
      action: isBulk ? 'SEND_BULK_PERSONAL_MAIL' : 'SEND_PERSONAL_MAIL',
      actionTitle: isBulk
        ? `Gửi thư cá nhân hàng loạt (${mailsToCreate.length} người chơi)`
        : 'Gửi thư cá nhân cho người chơi',
      mailId: first.MailId,
      mailType: 'personal',
      category,
      title,
      targetSummary,
      hasRewards,
      details: `Gửi thư [${CATEGORY_LABELS[category]}] tới ${targetSummary}${referenceTicketId ? ` (Mã phiếu: ${referenceTicketId})` : ''} — ${summarizeRewards(rewards)}.`,
    });

    return {
      sentCount: mailsToCreate.length,
      mails: mailsToCreate,
    };
  }

  async updateMailStatus(
    operator: AuthenticatedOperator,
    rawServerId: string,
    rawReceiverId: string,
    rawMailId: string,
    status: SystemMailStatus,
  ): Promise<SystemMailDocument> {
    const srv = await this.assertRegisteredServer(
      rawServerId,
      operator.authTokenForFirestore,
    );
    const mailId = this.assertValidMailId(rawMailId);
    const cleanReceiverId = (rawReceiverId || '').trim();
    const docPath = this.resolveMailDocPath(mailId, cleanReceiverId);

    let existingRaw = null;
    try {
      existingRaw = await this.firebase.getDocument(
        docPath,
        operator.authTokenForFirestore,
        srv.ServerId,
      );
    } catch (err) {
      this.wrapShardError(srv.ServerId, err);
    }
    if (!existingRaw) {
      throw new NotFoundException(
        `Không tìm thấy thư "${mailId}" trên cụm máy chủ ${srv.ServerId}.`,
      );
    }

    const existing = this.normalizeMailDocument(
      mailId,
      this.firebase.docToObject(existingRaw),
      srv.ServerId,
      cleanReceiverId,
    );
    const nextStatus: SystemMailStatus =
      status === 'REVOKED' ? 'REVOKED' : 'SENT';
    const updated: SystemMailDocument = {
      ...existing,
      ServerId: srv.ServerId,
      TargetServers: [srv.ServerId],
      Status: nextStatus,
      UpdatedAt: new Date().toISOString(),
      UpdatedBy: formatSafeCreatorLabel(operator),
    };

    try {
      await this.firebase.commitWrites(
        [
          {
            update: {
              name: this.firebase.fullDocumentName(docPath, srv.ServerId),
              fields: this.firebase.objectToFields(
                updated as unknown as Record<string, unknown>,
              ),
            },
          },
        ],
        operator.authTokenForFirestore,
        srv.ServerId,
      );
    } catch (err) {
      this.wrapShardError(srv.ServerId, err);
    }

    const targetSummary =
      updated.Type === 'global'
        ? `Toàn server @ ${srv.ServerId}`
        : `${updated.ReceiverName || updated.ReceiverId} @ ${srv.ServerId}`;

    await this.logMailActivity(operator, {
      action: nextStatus === 'REVOKED' ? 'REVOKE_MAIL' : 'RESTORE_MAIL',
      actionTitle:
        nextStatus === 'REVOKED'
          ? 'Thu hồi thư hệ thống'
          : 'Khôi phục hiển thị thư hệ thống',
      mailId: updated.MailId,
      mailType: updated.Type,
      category: updated.Category,
      title: updated.Title,
      targetSummary,
      hasRewards: updated.HasRewards,
      details:
        nextStatus === 'REVOKED'
          ? `Thu hồi thư "${updated.Title}" (${updated.MailId}) trên ${srv.ServerId} gửi tới ${targetSummary}.`
          : `Khôi phục trạng thái gửi cho thư "${updated.Title}" (${updated.MailId}) trên ${srv.ServerId}.`,
    });

    return updated;
  }

  async deleteMail(
    operator: AuthenticatedOperator,
    rawServerId: string,
    rawReceiverId: string,
    rawMailId: string,
  ): Promise<{ success: boolean; deletedMailId: string; serverId: string }> {
    const srv = await this.assertRegisteredServer(
      rawServerId,
      operator.authTokenForFirestore,
    );
    const mailId = this.assertValidMailId(rawMailId);
    const cleanReceiverId = (rawReceiverId || '').trim();
    let actualDocPath = this.resolveMailDocPath(mailId, cleanReceiverId);

    let existingRaw = null;
    try {
      existingRaw = await this.firebase.getDocument(
        actualDocPath,
        operator.authTokenForFirestore,
        srv.ServerId,
      );
      if (!existingRaw && cleanReceiverId) {
        // Fallback dọn thư cũ nếu từng nằm ở root Mailbox trước khi chuyển sang Hybrid
        const legacyPath = `${MAILBOX_COLLECTION}/${mailId}`;
        const legacyDoc = await this.firebase.getDocument(
          legacyPath,
          operator.authTokenForFirestore,
          srv.ServerId,
        );
        if (legacyDoc) {
          existingRaw = legacyDoc;
          actualDocPath = legacyPath;
        }
      }
    } catch (err) {
      this.wrapShardError(srv.ServerId, err);
    }
    if (!existingRaw) {
      throw new NotFoundException(
        `Không tìm thấy thư "${mailId}" trên cụm máy chủ ${srv.ServerId} để xóa.`,
      );
    }

    const existing = this.normalizeMailDocument(
      mailId,
      this.firebase.docToObject(existingRaw),
      srv.ServerId,
      this.parseUserIdFromDocName(existingRaw.name),
    );

    try {
      await this.firebase.deleteDocument(
        actualDocPath,
        operator.authTokenForFirestore,
        srv.ServerId,
      );
    } catch (err) {
      this.wrapShardError(srv.ServerId, err);
    }

    const targetSummary =
      existing.Type === 'global'
        ? `Toàn server @ ${srv.ServerId}`
        : `${existing.ReceiverName || existing.ReceiverId} @ ${srv.ServerId}`;

    await this.logMailActivity(operator, {
      action: 'DELETE_MAIL',
      actionTitle: 'Xóa vĩnh viễn thư hệ thống',
      mailId: existing.MailId,
      mailType: existing.Type,
      category: existing.Category,
      title: existing.Title,
      targetSummary,
      hasRewards: existing.HasRewards,
      details: `Xóa vĩnh viễn thư "${existing.Title}" (${existing.MailId}) trên ${srv.ServerId} gửi tới ${targetSummary}.`,
    });

    return { success: true, deletedMailId: mailId, serverId: srv.ServerId };
  }

  // ==================== AUDIT LOGS (ADMIN ONLY) ====================

  async getMailLogs(
    operator: AuthenticatedOperator,
    limitCount = 100,
  ): Promise<MailActivityLog[]> {
    const safeLimit = Math.min(Math.max(1, Math.trunc(limitCount) || 100), 200);
    let docs = [];
    try {
      docs = await this.firebase.runQuery(
        MAIL_LOGS_PARENT_PATH,
        {
          from: [{ collectionId: 'Activities' }],
          orderBy: [
            { field: { fieldPath: 'timestamp' }, direction: 'DESCENDING' },
          ],
          limit: safeLimit,
        },
        operator.authTokenForFirestore,
      );
    } catch {
      docs = await this.firebase.listDocuments(
        MAIL_LOGS_COLLECTION_PATH,
        operator.authTokenForFirestore,
      );
    }

    const list: MailActivityLog[] = docs.map((doc) => {
      const obj = this.firebase.docToObject(doc);
      const id = this.firebase.extractDocId(doc.name);
      const action =
        typeof obj.action === 'string'
          ? (obj.action as MailLogAction)
          : 'SEND_GLOBAL_MAIL';
      const actionTitle =
        typeof obj.actionTitle === 'string'
          ? obj.actionTitle
          : 'Thao tác thư hệ thống';
      const mailId = typeof obj.mailId === 'string' ? obj.mailId : '';
      const mailType: SystemMailType =
        obj.mailType === 'personal' ? 'personal' : 'global';
      const category = parseCategory(obj.category);
      const title = typeof obj.title === 'string' ? obj.title : mailId;
      const targetSummary =
        typeof obj.targetSummary === 'string' ? obj.targetSummary : '';
      const hasRewards = obj.hasRewards === true;
      const details = typeof obj.details === 'string' ? obj.details : '';
      const performedBy =
        typeof obj.performedBy === 'string' ? obj.performedBy : 'system';
      const performedByRole =
        typeof obj.performedByRole === 'string'
          ? obj.performedByRole
          : undefined;
      const timestamp = Number(obj.timestamp) || 0;
      const createdAt =
        typeof obj.createdAt === 'string' ? obj.createdAt : '';

      return {
        id,
        action,
        actionTitle,
        mailId,
        mailType,
        category,
        title,
        targetSummary,
        hasRewards,
        details,
        performedBy,
        ...(performedByRole ? { performedByRole } : {}),
        timestamp,
        createdAt,
      };
    });

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, safeLimit);
  }
}
