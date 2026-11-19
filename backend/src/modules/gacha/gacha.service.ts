import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FirestoreBatchWrite,
  GachaFirebaseService,
} from './gacha-firebase.service.js';
import { GachaMediaVariant, GachaR2Service } from './gacha-r2.service.js';
import {
  AuthenticatedOperator,
  GachaActivityLog,
  GachaBannerConfig,
  GachaLogAction,
  GachaSeasonDocument,
  GameItemReference,
  HeroReferenceItem,
} from './gacha.types.js';
import {
  VALID_ID_REGEX,
  asRecord,
  collectOtherReferencedKeys,
  normalizeBanner,
  normalizeSeason,
  sanitizeBannerForFirestore,
  toUtcIsoString,
  validateBannerConfig,
  validateSeasonInput,
} from './gacha.validation.js';

const SEASONS_COLLECTION = 'GachaBanners';
const LOGS_PARENT_PATH = 'Logs/GachaBanners';
const LOGS_COLLECTION_PATH = 'Logs/GachaBanners/Activities';
const HERO_CONFIGS_COLLECTION = 'HeroConfigs';
const ITEM_CONFIGS_COLLECTION = 'ItemConfigs';

function formatOperatorLabel(operator: AuthenticatedOperator): string {
  return operator.email || operator.username || 'system';
}

function resolveHeroRarity(
  rawRarity: unknown,
  rawLabel: unknown,
): { rarity: number; rarityLabel: string } {
  const num = Number(rawRarity);
  if (typeof rawLabel === 'string' && rawLabel.trim()) {
    return {
      rarity: Number.isFinite(num) ? num : 5,
      rarityLabel: rawLabel.trim().toUpperCase(),
    };
  }
  if (Number.isFinite(num)) {
    if (num >= 6) return { rarity: num, rarityLabel: 'UR' };
    if (num === 5) return { rarity: 5, rarityLabel: 'SSR' };
    if (num === 4) return { rarity: 4, rarityLabel: 'SR' };
    if (num > 0 && num <= 3) return { rarity: num, rarityLabel: 'R' };
  }
  return { rarity: 5, rarityLabel: 'SSR' };
}

function toTimestampMs(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

@Injectable()
export class GachaService {
  private readonly logger = new Logger(GachaService.name);

  constructor(
    private readonly firebase: GachaFirebaseService,
    private readonly r2: GachaR2Service,
  ) {}

  private throwValidationFailure(errors: string[]): never {
    throw new BadRequestException({
      message: errors[0] || 'Dữ liệu cấu hình không hợp lệ.',
      errors,
    });
  }

  private assertValidId(id: string, label: string): string {
    const trimmed = (id ?? '').trim();
    if (!VALID_ID_REGEX.test(trimmed)) {
      throw new BadRequestException(
        `${label} không hợp lệ. Chỉ cho phép chữ thường không dấu, số và dấu gạch dưới (^[a-z0-9_]+$).`,
      );
    }
    return trimmed;
  }

  private async logGachaActivity(
    operator: AuthenticatedOperator,
    payload: {
      action: GachaLogAction;
      actionTitle: string;
      seasonId: string;
      seasonName: string;
      bannerId?: string;
      bannerTitle?: string;
      bannerType?: string;
      version?: number;
      details: string;
    },
  ): Promise<void> {
    const now = Date.now();
    const record: Record<string, unknown> = {
      action: payload.action,
      actionTitle: payload.actionTitle,
      seasonId: payload.seasonId,
      seasonName: payload.seasonName,
      details: payload.details,
      performedBy: formatOperatorLabel(operator),
      performedByRole: operator.role,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
    };

    if (payload.bannerId) record.bannerId = payload.bannerId;
    if (payload.bannerTitle) record.bannerTitle = payload.bannerTitle;
    if (payload.bannerType) record.bannerType = payload.bannerType;
    if (typeof payload.version === 'number') record.version = payload.version;

    try {
      await this.firebase.createDocument(
        LOGS_COLLECTION_PATH,
        null,
        record,
        operator.authTokenForFirestore,
      );
    } catch (err) {
      this.logger.warn(
        `Không thể ghi nhật ký Gacha (${payload.action}): ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }

  // ==================== SEASONS ====================

  async getSeasons(
    operator: AuthenticatedOperator,
  ): Promise<GachaSeasonDocument[]> {
    const docs = await this.firebase.listDocuments(
      SEASONS_COLLECTION,
      operator.authTokenForFirestore,
    );

    const seasons = docs.map((doc) =>
      normalizeSeason(
        this.firebase.extractDocId(doc.name),
        this.firebase.docToObject(doc),
      ),
    );

    return seasons.sort((a, b) => {
      if (a.IsActive !== b.IsActive) return a.IsActive ? -1 : 1;
      const startDiff = Date.parse(b.StartTime || '') - Date.parse(a.StartTime || '');
      if (!Number.isNaN(startDiff) && startDiff !== 0) return startDiff;
      return a.SeasonId.localeCompare(b.SeasonId);
    });
  }

  async getSeasonById(
    operator: AuthenticatedOperator,
    rawSeasonId: string,
  ): Promise<GachaSeasonDocument> {
    const seasonId = this.assertValidId(rawSeasonId, 'Mã mùa (SeasonId)');
    const doc = await this.firebase.getDocument(
      `${SEASONS_COLLECTION}/${seasonId}`,
      operator.authTokenForFirestore,
    );
    if (!doc) {
      throw new NotFoundException(`Không tìm thấy mùa phát hành "${seasonId}".`);
    }
    return normalizeSeason(seasonId, this.firebase.docToObject(doc));
  }

  async createSeason(
    operator: AuthenticatedOperator,
    rawBody: Record<string, unknown>,
  ): Promise<GachaSeasonDocument> {
    const seasonId = String(rawBody.SeasonId ?? '').trim();
    const seasonName = String(rawBody.SeasonName ?? '').trim();
    const startIso = toUtcIsoString(String(rawBody.StartTime ?? ''));
    const endIso = toUtcIsoString(String(rawBody.EndTime ?? ''));

    const validation = validateSeasonInput({
      SeasonId: seasonId,
      SeasonName: seasonName,
      StartTime: startIso,
      EndTime: endIso,
    });
    if (!validation.valid) {
      this.throwValidationFailure(validation.errors);
    }

    const existing = await this.firebase.getDocument(
      `${SEASONS_COLLECTION}/${seasonId}`,
      operator.authTokenForFirestore,
    );
    if (existing) {
      throw new ConflictException(`Mã mùa "${seasonId}" đã tồn tại trên hệ thống.`);
    }

    const requestActive = Boolean(rawBody.IsActive);
    if (
      requestActive &&
      operator.role !== 'Admin' &&
      !operator.permissions.includes('gamedata.gacha.activate')
    ) {
      throw new ForbiddenException(
        'Bạn chưa được cấp quyền kích hoạt mùa phát hành ngay khi tạo.',
      );
    }

    const nowIso = toUtcIsoString(new Date());
    const opLabel = formatOperatorLabel(operator);

    if (requestActive) {
      const allSeasons = await this.getSeasons(operator);
      const deactivateWrites: FirestoreBatchWrite[] = allSeasons
        .filter((s) => s.IsActive && s.SeasonId !== seasonId)
        .map((s) => ({
          update: {
            name: this.firebase.fullDocumentName(
              `${SEASONS_COLLECTION}/${s.SeasonId}`,
            ),
            fields: this.firebase.objectToFields({
              IsActive: false,
              LastUpdated: nowIso,
              UpdatedBy: opLabel,
            }),
          },
          updateMask: {
            fieldPaths: ['IsActive', 'LastUpdated', 'UpdatedBy'],
          },
          updateTransforms: [
            { fieldPath: 'Version', increment: { integerValue: '1' } },
          ],
        }));
      if (deactivateWrites.length > 0) {
        await this.firebase.commitWrites(
          deactivateWrites,
          operator.authTokenForFirestore,
        );
      }
    }

    const newSeason: GachaSeasonDocument = {
      SeasonId: seasonId,
      SeasonName: seasonName,
      Version: 1,
      IsActive: requestActive,
      StartTime: startIso,
      EndTime: endIso,
      LastUpdated: nowIso,
      UpdatedBy: opLabel,
      Banners: {},
    };

    await this.firebase.createDocument(
      SEASONS_COLLECTION,
      seasonId,
      newSeason as unknown as Record<string, unknown>,
      operator.authTokenForFirestore,
    );

    await this.logGachaActivity(operator, {
      action: 'CREATE_SEASON',
      actionTitle: 'Tạo mùa phát hành Gacha mới',
      seasonId,
      seasonName,
      version: 1,
      details: `Tạo mới mùa "${seasonName}" (${seasonId}), hiệu lực ${startIso} -> ${endIso}.`,
    });

    return newSeason;
  }

  async cloneSeason(
    operator: AuthenticatedOperator,
    rawSourceSeasonId: string,
    rawBody: Record<string, unknown>,
  ): Promise<GachaSeasonDocument> {
    const sourceSeason = await this.getSeasonById(operator, rawSourceSeasonId);

    const targetId = String(rawBody.SeasonId ?? '').trim();
    const targetName = String(rawBody.SeasonName ?? '').trim();
    const startIso = toUtcIsoString(String(rawBody.StartTime ?? ''));
    const endIso = toUtcIsoString(String(rawBody.EndTime ?? ''));

    const validation = validateSeasonInput({
      SeasonId: targetId,
      SeasonName: targetName,
      StartTime: startIso,
      EndTime: endIso,
    });
    if (!validation.valid) {
      this.throwValidationFailure(validation.errors);
    }

    const existingTarget = await this.firebase.getDocument(
      `${SEASONS_COLLECTION}/${targetId}`,
      operator.authTokenForFirestore,
    );
    if (existingTarget) {
      throw new ConflictException(`Mã mùa đích "${targetId}" đã tồn tại trên hệ thống.`);
    }

    const syncLimitedBannerTimes = Boolean(rawBody.syncLimitedBannerTimes);
    const sanitizedBanners: Record<string, Record<string, unknown>> = {};
    const clonedBanners: Record<string, GachaBannerConfig> = {};
    for (const [bId, banner] of Object.entries(sourceSeason.Banners || {})) {
      const prepared: GachaBannerConfig =
        syncLimitedBannerTimes &&
        banner.BannerType === 'limited' &&
        (banner.StartTime !== null || banner.EndTime !== null)
          ? {
              ...banner,
              StartTime: startIso,
              EndTime: endIso,
            }
          : banner;
      const clean = sanitizeBannerForFirestore(prepared);
      sanitizedBanners[bId] = clean;
      clonedBanners[bId] = normalizeBanner(bId, clean);
    }

    const nowIso = toUtcIsoString(new Date());
    const firestorePayload = {
      SeasonId: targetId,
      SeasonName: targetName,
      Version: 1,
      IsActive: false,
      StartTime: startIso,
      EndTime: endIso,
      LastUpdated: nowIso,
      UpdatedBy: formatOperatorLabel(operator),
      Banners: sanitizedBanners,
    };

    await this.firebase.createDocument(
      SEASONS_COLLECTION,
      targetId,
      firestorePayload,
      operator.authTokenForFirestore,
    );

    await this.logGachaActivity(operator, {
      action: 'CLONE_SEASON',
      actionTitle: 'Nhân bản mùa phát hành Gacha',
      seasonId: targetId,
      seasonName: targetName,
      version: 1,
      details: `Nhân bản từ mùa "${sourceSeason.SeasonId}" sang "${targetId}" (${Object.keys(clonedBanners).length} banner).`,
    });

    return {
      SeasonId: targetId,
      SeasonName: targetName,
      Version: 1,
      IsActive: false,
      StartTime: startIso,
      EndTime: endIso,
      LastUpdated: nowIso,
      UpdatedBy: formatOperatorLabel(operator),
      Banners: clonedBanners,
    };
  }

  async updateSeasonMetadata(
    operator: AuthenticatedOperator,
    rawSeasonId: string,
    rawBody: Record<string, unknown>,
  ): Promise<GachaSeasonDocument> {
    const existing = await this.getSeasonById(operator, rawSeasonId);
    const seasonName = String(rawBody.SeasonName ?? existing.SeasonName).trim();
    const startIso = toUtcIsoString(
      String(rawBody.StartTime ?? existing.StartTime),
    );
    const endIso = toUtcIsoString(String(rawBody.EndTime ?? existing.EndTime));

    const validation = validateSeasonInput({
      SeasonId: existing.SeasonId,
      SeasonName: seasonName,
      StartTime: startIso,
      EndTime: endIso,
    });
    if (!validation.valid) {
      this.throwValidationFailure(validation.errors);
    }

    const nowIso = toUtcIsoString(new Date());
    const opLabel = formatOperatorLabel(operator);

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${SEASONS_COLLECTION}/${existing.SeasonId}`,
            ),
            fields: this.firebase.objectToFields({
              SeasonName: seasonName,
              StartTime: startIso,
              EndTime: endIso,
              LastUpdated: nowIso,
              UpdatedBy: opLabel,
            }),
          },
          updateMask: {
            fieldPaths: [
              'SeasonName',
              'StartTime',
              'EndTime',
              'LastUpdated',
              'UpdatedBy',
            ],
          },
          updateTransforms: [
            { fieldPath: 'Version', increment: { integerValue: '1' } },
          ],
        },
      ],
      operator.authTokenForFirestore,
    );

    const nextVersion = existing.Version + 1;

    await this.logGachaActivity(operator, {
      action: 'UPDATE_SEASON',
      actionTitle: 'Cập nhật thông tin mùa Gacha',
      seasonId: existing.SeasonId,
      seasonName,
      version: nextVersion,
      details: `Cập nhật tên/lịch mùa "${seasonName}" (${startIso} -> ${endIso}).`,
    });

    return {
      ...existing,
      SeasonName: seasonName,
      StartTime: startIso,
      EndTime: endIso,
      Version: nextVersion,
      LastUpdated: nowIso,
      UpdatedBy: opLabel,
    };
  }

  async activateSeason(
    operator: AuthenticatedOperator,
    rawSeasonId: string,
  ): Promise<GachaSeasonDocument> {
    const seasonId = this.assertValidId(rawSeasonId, 'Mã mùa (SeasonId)');
    const allSeasons = await this.getSeasons(operator);
    const target = allSeasons.find((s) => s.SeasonId === seasonId);

    if (!target) {
      throw new NotFoundException(`Không tìm thấy mùa phát hành "${seasonId}".`);
    }

    const nowIso = toUtcIsoString(new Date());
    const opLabel = formatOperatorLabel(operator);
    const writes: FirestoreBatchWrite[] = [];

    for (const season of allSeasons) {
      if (season.SeasonId !== seasonId && season.IsActive) {
        writes.push({
          update: {
            name: this.firebase.fullDocumentName(
              `${SEASONS_COLLECTION}/${season.SeasonId}`,
            ),
            fields: this.firebase.objectToFields({
              IsActive: false,
              LastUpdated: nowIso,
              UpdatedBy: opLabel,
            }),
          },
          updateMask: {
            fieldPaths: ['IsActive', 'LastUpdated', 'UpdatedBy'],
          },
          updateTransforms: [
            { fieldPath: 'Version', increment: { integerValue: '1' } },
          ],
        });
      }
    }

    writes.push({
      update: {
        name: this.firebase.fullDocumentName(`${SEASONS_COLLECTION}/${seasonId}`),
        fields: this.firebase.objectToFields({
          IsActive: true,
          LastUpdated: nowIso,
          UpdatedBy: opLabel,
        }),
      },
      updateMask: {
        fieldPaths: ['IsActive', 'LastUpdated', 'UpdatedBy'],
      },
      updateTransforms: [
        { fieldPath: 'Version', increment: { integerValue: '1' } },
      ],
    });

    await this.firebase.commitWrites(writes, operator.authTokenForFirestore);

    const nextVersion = target.Version + 1;
    await this.logGachaActivity(operator, {
      action: 'ACTIVATE_SEASON',
      actionTitle: 'Kích hoạt mùa phát hành Gacha',
      seasonId,
      seasonName: target.SeasonName,
      version: nextVersion,
      details: `Kích hoạt mùa "${target.SeasonName}" (${seasonId}) và tắt các mùa khác.`,
    });

    return {
      ...target,
      IsActive: true,
      Version: nextVersion,
      LastUpdated: nowIso,
      UpdatedBy: opLabel,
    };
  }

  async deactivateSeason(
    operator: AuthenticatedOperator,
    rawSeasonId: string,
  ): Promise<GachaSeasonDocument> {
    const existing = await this.getSeasonById(operator, rawSeasonId);
    const nowIso = toUtcIsoString(new Date());
    const opLabel = formatOperatorLabel(operator);

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${SEASONS_COLLECTION}/${existing.SeasonId}`,
            ),
            fields: this.firebase.objectToFields({
              IsActive: false,
              LastUpdated: nowIso,
              UpdatedBy: opLabel,
            }),
          },
          updateMask: {
            fieldPaths: ['IsActive', 'LastUpdated', 'UpdatedBy'],
          },
          updateTransforms: [
            { fieldPath: 'Version', increment: { integerValue: '1' } },
          ],
        },
      ],
      operator.authTokenForFirestore,
    );

    const nextVersion = existing.Version + 1;
    await this.logGachaActivity(operator, {
      action: 'DEACTIVATE_SEASON',
      actionTitle: 'Tạm tắt mùa phát hành Gacha',
      seasonId: existing.SeasonId,
      seasonName: existing.SeasonName,
      version: nextVersion,
      details: `Tạm tắt trạng thái phát hành của mùa "${existing.SeasonName}" (${existing.SeasonId}).`,
    });

    return {
      ...existing,
      IsActive: false,
      Version: nextVersion,
      LastUpdated: nowIso,
      UpdatedBy: opLabel,
    };
  }

  async deleteDraftSeason(
    operator: AuthenticatedOperator,
    rawSeasonId: string,
  ): Promise<{ success: true; deletedMediaKeys: string[] }> {
    const seasonId = this.assertValidId(rawSeasonId, 'Mã mùa (SeasonId)');
    const allSeasons = await this.getSeasons(operator);
    const target = allSeasons.find((s) => s.SeasonId === seasonId);

    if (!target) {
      throw new NotFoundException(`Không tìm thấy mùa phát hành "${seasonId}".`);
    }
    if (target.IsActive) {
      throw new BadRequestException(
        'Không thể xóa mùa đang ở trạng thái phát hành (Active). Hãy chuyển sang mùa khác hoặc tắt trước khi xóa.',
      );
    }

    const otherUsedKeys = collectOtherReferencedKeys(allSeasons, { seasonId });
    const candidateKeys: string[] = [];
    for (const banner of Object.values(target.Banners || {})) {
      if (banner.BannerImageKey && !otherUsedKeys.has(banner.BannerImageKey)) {
        candidateKeys.push(banner.BannerImageKey);
      }
      if (
        banner.BannerTabImageKey &&
        !otherUsedKeys.has(banner.BannerTabImageKey)
      ) {
        candidateKeys.push(banner.BannerTabImageKey);
      }
    }

    await this.firebase.deleteDocument(
      `${SEASONS_COLLECTION}/${seasonId}`,
      operator.authTokenForFirestore,
    );

    const mediaCleanup = await this.r2.deleteBannerObjects(candidateKeys);

    await this.logGachaActivity(operator, {
      action: 'DELETE_SEASON',
      actionTitle: 'Xóa mùa phát hành nháp',
      seasonId,
      seasonName: target.SeasonName,
      version: target.Version,
      details: `Xóa mùa nháp "${target.SeasonName}" (${seasonId}) và dọn ${mediaCleanup.deletedKeys.length} tệp ảnh không còn sử dụng.`,
    });

    return { success: true, deletedMediaKeys: mediaCleanup.deletedKeys };
  }

  // ==================== BANNERS INSIDE SEASON ====================

  async saveBannerInSeason(
    operator: AuthenticatedOperator,
    rawSeasonId: string,
    body: Record<string, unknown>,
    options: { isEditing: boolean; routeBannerId?: string },
  ): Promise<GachaBannerConfig> {
    const seasonId = this.assertValidId(rawSeasonId, 'Mã mùa (SeasonId)');
    const allSeasons = await this.getSeasons(operator);
    const season = allSeasons.find((s) => s.SeasonId === seasonId);

    if (!season) {
      throw new NotFoundException(`Không tìm thấy mùa phát hành "${seasonId}".`);
    }

    const rawBannerId = options.isEditing
      ? this.assertValidId(
          options.routeBannerId ?? String(body.BannerId ?? ''),
          'Mã banner (BannerId)',
        )
      : String(body.BannerId ?? '').trim();

    if (
      options.isEditing &&
      body.BannerId !== undefined &&
      String(body.BannerId).trim() !== rawBannerId
    ) {
      throw new BadRequestException(
        'Không thể thay đổi Mã banner (BannerId) khi đang chỉnh sửa.',
      );
    }

    if (options.isEditing && !season.Banners[rawBannerId]) {
      throw new NotFoundException(
        `Không tìm thấy banner "${rawBannerId}" trong mùa "${seasonId}".`,
      );
    }

    const candidate = normalizeBanner(rawBannerId, asRecord(body));
    const existingIds = Object.keys(season.Banners);

    const validation = validateBannerConfig(
      candidate,
      existingIds,
      options.isEditing,
    );
    if (!validation.valid) {
      this.throwValidationFailure(validation.errors);
    }

    const cleanBannerRaw = sanitizeBannerForFirestore(candidate);
    const cleanBanner = normalizeBanner(rawBannerId, cleanBannerRaw);
    const oldBanner = season.Banners[rawBannerId];
    const nowIso = toUtcIsoString(new Date());
    const opLabel = formatOperatorLabel(operator);

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${SEASONS_COLLECTION}/${seasonId}`,
            ),
            fields: {
              LastUpdated: this.firebase.toFirestoreValue(nowIso),
              UpdatedBy: this.firebase.toFirestoreValue(opLabel),
              Banners: {
                mapValue: {
                  fields: {
                    [rawBannerId]: this.firebase.toFirestoreValue(cleanBannerRaw),
                  },
                },
              },
            },
          },
          updateMask: {
            fieldPaths: [`Banners.${rawBannerId}`, 'LastUpdated', 'UpdatedBy'],
          },
          updateTransforms: [
            { fieldPath: 'Version', increment: { integerValue: '1' } },
          ],
        },
      ],
      operator.authTokenForFirestore,
    );

    if (oldBanner) {
      const otherUsedKeys = collectOtherReferencedKeys(allSeasons, {
        seasonId,
        bannerId: rawBannerId,
      });
      const newKeys = new Set<string>(
        [cleanBanner.BannerImageKey, cleanBanner.BannerTabImageKey].filter(
          (k): k is string => Boolean(k),
        ),
      );
      const staleKeys = [oldBanner.BannerImageKey, oldBanner.BannerTabImageKey]
        .filter((k): k is string => Boolean(k))
        .filter((k) => !newKeys.has(k) && !otherUsedKeys.has(k));

      if (staleKeys.length > 0) {
        await this.r2.deleteBannerObjects(staleKeys);
      }
    }

    await this.logGachaActivity(operator, {
      action: options.isEditing ? 'UPDATE_BANNER' : 'CREATE_BANNER',
      actionTitle: options.isEditing
        ? 'Cập nhật cấu hình Banner Gacha'
        : 'Thêm Banner Gacha mới vào mùa',
      seasonId,
      seasonName: season.SeasonName,
      bannerId: cleanBanner.BannerId,
      bannerTitle: cleanBanner.Title,
      bannerType: cleanBanner.BannerType,
      version: season.Version + 1,
      details: `${options.isEditing ? 'Cập nhật' : 'Tạo mới'} banner "${cleanBanner.Title}" (${cleanBanner.BannerId}) thuộc mùa "${season.SeasonName}".`,
    });

    return cleanBanner;
  }

  async toggleBannerActive(
    operator: AuthenticatedOperator,
    rawSeasonId: string,
    rawBannerId: string,
    isActive: boolean,
  ): Promise<{ BannerId: string; IsActive: boolean }> {
    const seasonId = this.assertValidId(rawSeasonId, 'Mã mùa (SeasonId)');
    const bannerId = this.assertValidId(rawBannerId, 'Mã banner (BannerId)');
    const season = await this.getSeasonById(operator, seasonId);
    const banner = season.Banners[bannerId];

    if (!banner) {
      throw new NotFoundException(
        `Không tìm thấy banner "${bannerId}" trong mùa "${seasonId}".`,
      );
    }

    const nextActive = Boolean(isActive);
    const nowIso = toUtcIsoString(new Date());
    const opLabel = formatOperatorLabel(operator);

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${SEASONS_COLLECTION}/${seasonId}`,
            ),
            fields: {
              LastUpdated: this.firebase.toFirestoreValue(nowIso),
              UpdatedBy: this.firebase.toFirestoreValue(opLabel),
              Banners: {
                mapValue: {
                  fields: {
                    [bannerId]: {
                      mapValue: {
                        fields: {
                          IsActive: this.firebase.toFirestoreValue(nextActive),
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          updateMask: {
            fieldPaths: [
              `Banners.${bannerId}.IsActive`,
              'LastUpdated',
              'UpdatedBy',
            ],
          },
          updateTransforms: [
            { fieldPath: 'Version', increment: { integerValue: '1' } },
          ],
        },
      ],
      operator.authTokenForFirestore,
    );

    await this.logGachaActivity(operator, {
      action: 'TOGGLE_BANNER',
      actionTitle: nextActive ? 'Bật hoạt động Banner' : 'Tạm tắt Banner',
      seasonId,
      seasonName: season.SeasonName,
      bannerId,
      bannerTitle: banner.Title,
      bannerType: banner.BannerType,
      version: season.Version + 1,
      details: `${nextActive ? 'Bật' : 'Tắt'} banner "${banner.Title}" (${bannerId}) trong mùa "${season.SeasonName}".`,
    });

    return { BannerId: bannerId, IsActive: nextActive };
  }

  async deleteBannerFromSeason(
    operator: AuthenticatedOperator,
    rawSeasonId: string,
    rawBannerId: string,
  ): Promise<{ success: true; deletedMediaKeys: string[] }> {
    const seasonId = this.assertValidId(rawSeasonId, 'Mã mùa (SeasonId)');
    const bannerId = this.assertValidId(rawBannerId, 'Mã banner (BannerId)');
    const allSeasons = await this.getSeasons(operator);
    const season = allSeasons.find((s) => s.SeasonId === seasonId);

    if (!season) {
      throw new NotFoundException(`Không tìm thấy mùa phát hành "${seasonId}".`);
    }

    const removedBanner = season.Banners[bannerId];
    if (!removedBanner) {
      throw new NotFoundException(
        `Không tìm thấy banner "${bannerId}" trong mùa "${seasonId}".`,
      );
    }

    const remainingBanners: Record<string, Record<string, unknown>> = {};
    for (const [key, val] of Object.entries(season.Banners)) {
      if (key !== bannerId) {
        remainingBanners[key] = sanitizeBannerForFirestore(val);
      }
    }

    const nowIso = toUtcIsoString(new Date());
    const opLabel = formatOperatorLabel(operator);

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${SEASONS_COLLECTION}/${seasonId}`,
            ),
            fields: this.firebase.objectToFields({
              Banners: remainingBanners,
              LastUpdated: nowIso,
              UpdatedBy: opLabel,
            }),
          },
          updateMask: {
            fieldPaths: ['Banners', 'LastUpdated', 'UpdatedBy'],
          },
          updateTransforms: [
            { fieldPath: 'Version', increment: { integerValue: '1' } },
          ],
        },
      ],
      operator.authTokenForFirestore,
    );

    const otherUsedKeys = collectOtherReferencedKeys(allSeasons, {
      seasonId,
      bannerId,
    });
    const keysToDelete = [
      removedBanner.BannerImageKey,
      removedBanner.BannerTabImageKey,
    ]
      .filter((k): k is string => Boolean(k))
      .filter((k) => !otherUsedKeys.has(k));

    const mediaCleanup = await this.r2.deleteBannerObjects(keysToDelete);

    await this.logGachaActivity(operator, {
      action: 'DELETE_BANNER',
      actionTitle: 'Xóa Banner khỏi mùa phát hành',
      seasonId,
      seasonName: season.SeasonName,
      bannerId,
      bannerTitle: removedBanner.Title,
      bannerType: removedBanner.BannerType,
      version: season.Version + 1,
      details: `Xóa banner "${removedBanner.Title}" (${bannerId}) khỏi mùa "${season.SeasonName}" và dọn ${mediaCleanup.deletedKeys.length} ảnh thừa.`,
    });

    return { success: true, deletedMediaKeys: mediaCleanup.deletedKeys };
  }

  // ==================== REFERENCES (HEROES & ITEMS) ====================

  async getReferenceHeroes(
    operator: AuthenticatedOperator,
  ): Promise<HeroReferenceItem[]> {
    const heroDocs = await this.firebase.listDocuments(
      HERO_CONFIGS_COLLECTION,
      operator.authTokenForFirestore,
    );

    const results: HeroReferenceItem[] = [];
    const concurrency = 10;

    for (let i = 0; i < heroDocs.length; i += concurrency) {
      const batch = heroDocs.slice(i, i + concurrency);
      const batchMapped = await Promise.all(
        batch.map(async (doc) => {
          const heroId = this.firebase.extractDocId(doc.name);
          const data = this.firebase.docToObject(doc);
          let image = String(data.Image || '').trim();
          let title = String(data.Title || '').trim();

          try {
            const profileDoc = await this.firebase.getDocument(
              `${HERO_CONFIGS_COLLECTION}/${heroId}/Profile/info`,
              operator.authTokenForFirestore,
            );
            if (profileDoc) {
              const profileData = this.firebase.docToObject(profileDoc);
              if (profileData.Image) image = String(profileData.Image).trim();
              if (profileData.Title) title = String(profileData.Title).trim();
            }
          } catch {
            // Bỏ qua nếu nhân vật chưa có hồ sơ mở rộng
          }

          const { rarity, rarityLabel } = resolveHeroRarity(
            data.Rarity,
            data.RarityLabel,
          );

          return {
            id: String(data.HeroId || heroId).trim(),
            name: String(data.HeroName || data.Name || heroId).trim(),
            title: title || undefined,
            role: String(data.Role || 'Valkyria').trim(),
            rarity,
            rarityLabel,
            image,
          } satisfies HeroReferenceItem;
        }),
      );
      results.push(...batchMapped);
    }

    return results.sort((a, b) => {
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      return a.name.localeCompare(b.name);
    });
  }

  async getReferenceItems(
    operator: AuthenticatedOperator,
  ): Promise<GameItemReference[]> {
    const itemDocs = await this.firebase.listDocuments(
      ITEM_CONFIGS_COLLECTION,
      operator.authTokenForFirestore,
    );

    const items: GameItemReference[] = itemDocs.map((doc) => {
      const id = this.firebase.extractDocId(doc.name);
      const data = this.firebase.docToObject(doc);
      const itemId = String(
        data.ItemId || data.itemId || data.Id || data.id || id,
      ).trim();
      const name = String(
        data.ItemName || data.Name || data.name || data.Title || itemId,
      ).trim();
      const rawType = data.Type ?? data.ItemType ?? data.type ?? 0;
      const itemType = Number.isFinite(Number(rawType)) ? Number(rawType) : 0;
      const description = String(
        data.Description || data.description || data.Desc || '',
      ).trim();
      const rawRarity = data.Rarity ?? data.rarity;
      let rarity = '';
      if (typeof rawRarity === 'number' && Number.isFinite(rawRarity)) {
        const rNum = Math.trunc(rawRarity);
        rarity =
          rNum >= 4
            ? 'UR'
            : rNum === 3
              ? 'SSR'
              : rNum === 2
                ? 'SR'
                : rNum === 1
                  ? 'R'
                  : 'N';
      } else if (typeof rawRarity === 'string') {
        rarity = rawRarity.trim();
      }
      const iconUrl = String(
        data.IconUrl || data.ImageUrl || data.Image || data.iconUrl || '',
      ).trim();

      return {
        ItemId: itemId,
        Name: name,
        Description: description || undefined,
        Type: itemType,
        Rarity: rarity || undefined,
        IconUrl: iconUrl || undefined,
        IconKey: data.IconKey ? String(data.IconKey).trim() : undefined,
      };
    });

    return items.sort((a, b) => {
      if (a.Type === 4 && b.Type !== 4) return -1;
      if (a.Type !== 4 && b.Type === 4) return 1;
      return a.ItemId.localeCompare(b.ItemId, 'vi');
    });
  }

  // ==================== MEDIA PRESIGN & CLEANUP ====================

  createMediaPresignUrl(body: Record<string, unknown>) {
    const variantRaw = String(body.variant ?? 'main').trim().toLowerCase();
    const variant: GachaMediaVariant = variantRaw === 'tab' ? 'tab' : 'main';
    const fileSizeRaw = body.fileSize;
    const fileSize =
      typeof fileSizeRaw === 'number' && Number.isFinite(fileSizeRaw)
        ? fileSizeRaw
        : undefined;

    return this.r2.createGachaBannerPresignUrl({
      seasonId: String(body.seasonId ?? ''),
      bannerId: String(body.bannerId ?? ''),
      variant,
      fileName: body.fileName ? String(body.fileName) : undefined,
      contentType: String(body.contentType ?? ''),
      fileSize,
    });
  }

  async cleanupUnusedTempMedia(
    operator: AuthenticatedOperator,
    rawKeys: unknown,
  ): Promise<{ deletedKeys: string[]; skippedLiveKeys: string[] }> {
    if (!Array.isArray(rawKeys)) {
      throw new BadRequestException('Danh sách khóa ảnh cần dọn không hợp lệ.');
    }

    const keys = rawKeys
      .map((k) => (typeof k === 'string' ? k.trim() : ''))
      .filter(Boolean);

    if (keys.length === 0) {
      return { deletedKeys: [], skippedLiveKeys: [] };
    }

    const allSeasons = await this.getSeasons(operator);
    const liveKeys = collectOtherReferencedKeys(allSeasons);

    const safeToDelete: string[] = [];
    const skippedLiveKeys: string[] = [];
    for (const key of keys) {
      if (liveKeys.has(key)) {
        skippedLiveKeys.push(key);
      } else {
        safeToDelete.push(key);
      }
    }

    const res = await this.r2.deleteBannerObjects(safeToDelete);
    return {
      deletedKeys: res.deletedKeys,
      skippedLiveKeys,
    };
  }

  // ==================== AUDIT LOGS (ADMIN ONLY) ====================

  async getGachaLogs(
    operator: AuthenticatedOperator,
    limitCount = 50,
  ): Promise<GachaActivityLog[]> {
    const safeLimit = Math.min(Math.max(1, Math.trunc(limitCount) || 50), 200);
    const docs = await this.firebase.runQuery(
      LOGS_PARENT_PATH,
      {
        from: [{ collectionId: 'Activities' }],
        orderBy: [
          {
            field: { fieldPath: 'timestamp' },
            direction: 'DESCENDING',
          },
        ],
        limit: safeLimit,
      },
      operator.authTokenForFirestore,
    );

    return docs.map((doc) => {
      const id = this.firebase.extractDocId(doc.name);
      const data = this.firebase.docToObject(doc);
      const ts = toTimestampMs(data.timestamp);
      return {
        id,
        action: String(data.action || 'UPDATE_BANNER') as GachaLogAction,
        actionTitle: String(data.actionTitle || 'Thao tác Banner Gacha'),
        seasonId: String(data.seasonId || ''),
        seasonName: String(data.seasonName || ''),
        bannerId: data.bannerId ? String(data.bannerId) : undefined,
        bannerTitle: data.bannerTitle ? String(data.bannerTitle) : undefined,
        bannerType: data.bannerType ? String(data.bannerType) : undefined,
        version:
          typeof data.version === 'number' ? data.version : undefined,
        details: String(data.details || ''),
        performedBy: String(data.performedBy || 'Hệ thống'),
        performedByRole: data.performedByRole
          ? String(data.performedByRole)
          : undefined,
        timestamp: ts,
        createdAt: String(
          data.createdAt || (ts ? new Date(ts).toISOString() : ''),
        ),
      };
    });
  }
}
