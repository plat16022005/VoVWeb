import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GachaFirebaseService } from './gacha-firebase.service.js';
import { GachaR2Service } from './gacha-r2.service.js';
import { GachaService } from './gacha.service.js';
import { AuthenticatedOperator } from './gacha.types.js';

describe('GachaService', () => {
  let service: GachaService;
  let firebaseMock: Record<string, ReturnType<typeof vi.fn>>;
  let r2Mock: Record<string, ReturnType<typeof vi.fn>>;

  const adminOp: AuthenticatedOperator = {
    uid: 'admin_1',
    email: 'admin@veyra.game',
    username: 'AdminVeyra',
    role: 'Admin',
    permissionGroups: ['game_data'],
    permissions: [],
    authTokenForFirestore: 'token_admin',
  };

  const managerNoActivateOp: AuthenticatedOperator = {
    uid: 'mgr_1',
    email: 'mgr@veyra.game',
    username: 'ManagerVeyra',
    role: 'Manager',
    permissionGroups: ['game_data'],
    permissions: ['gamedata.gacha.view', 'gamedata.gacha.edit'],
    authTokenForFirestore: 'token_mgr',
  };

  beforeEach(() => {
    firebaseMock = {
      listDocuments: vi.fn().mockResolvedValue([]),
      getDocument: vi.fn().mockResolvedValue(null),
      createDocument: vi.fn().mockResolvedValue({}),
      commitWrites: vi.fn().mockResolvedValue(undefined),
      extractDocId: vi.fn((name: string) => name.split('/').pop() || ''),
      docToObject: vi.fn((doc: { data?: Record<string, unknown> }) => doc.data || {}),
      fullDocumentName: vi.fn((path: string) => `projects/test/databases/(default)/documents/${path}`),
      objectToFields: vi.fn((obj: Record<string, unknown>) => obj),
    };
    r2Mock = {
      deleteBannerMediaObjects: vi.fn().mockResolvedValue([]),
    };
    service = new GachaService(
      firebaseMock as unknown as GachaFirebaseService,
      r2Mock as unknown as GachaR2Service,
    );
  });

  it('getSeasons sắp xếp mùa đang kích hoạt (IsActive) lên đầu', async () => {
    firebaseMock.listDocuments.mockResolvedValue([
      {
        name: 'projects/p/databases/(default)/documents/GachaBanners/season_01',
        data: {
          SeasonId: 'season_01',
          SeasonName: 'Mùa 1',
          IsActive: false,
          StartTime: '2026-10-01T00:00:00Z',
          EndTime: '2026-10-20T00:00:00Z',
        },
      },
      {
        name: 'projects/p/databases/(default)/documents/GachaBanners/season_02',
        data: {
          SeasonId: 'season_02',
          SeasonName: 'Mùa 2 Đang Mở',
          IsActive: true,
          StartTime: '2026-11-01T00:00:00Z',
          EndTime: '2026-11-20T00:00:00Z',
        },
      },
    ]);

    const list = await service.getSeasons(adminOp);
    expect(list[0].SeasonId).toBe('season_02');
    expect(list[1].SeasonId).toBe('season_01');
  });

  it('getSeasonById từ chối SeasonId sai định dạng và ném NotFoundException khi không tồn tại', async () => {
    await expect(
      service.getSeasonById(adminOp, 'INVALID-ID!'),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.getSeasonById(adminOp, 'season_missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createSeason kiểm tra trùng mã mùa và quyền kích hoạt gamedata.gacha.activate', async () => {
    const payload = {
      SeasonId: 'season_new',
      SeasonName: 'Mùa Tinh Tú',
      StartTime: '2026-11-01T00:00:00Z',
      EndTime: '2026-12-01T00:00:00Z',
      IsActive: true,
    };

    // Manager thiếu quyền activate sẽ bị chặn khi tạo kèm IsActive=true
    await expect(
      service.createSeason(managerNoActivateOp, payload),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // Admin tạo thành công
    const created = await service.createSeason(adminOp, payload);
    expect(created.SeasonId).toBe('season_new');
    expect(created.IsActive).toBe(true);

    // Nếu đã tồn tại thì ném ConflictException
    firebaseMock.getDocument.mockResolvedValueOnce({ name: 'dup', data: {} });
    await expect(service.createSeason(adminOp, payload)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('cloneSeason nhân bản mùa phát hành và luôn đặt bản mới ở trạng thái nháp (IsActive = false)', async () => {
    firebaseMock.getDocument
      .mockResolvedValueOnce({
        name: 'projects/p/databases/(default)/documents/GachaBanners/season_src',
        data: {
          SeasonId: 'season_src',
          SeasonName: 'Mùa Gốc',
          IsActive: true,
          StartTime: '2026-10-01T00:00:00Z',
          EndTime: '2026-10-30T00:00:00Z',
          Banners: {},
        },
      })
      .mockResolvedValueOnce(null);

    const cloned = await service.cloneSeason(adminOp, 'season_src', {
      SeasonId: 'season_clone',
      SeasonName: 'Mùa Nhân Bản',
      StartTime: '2026-11-01T00:00:00Z',
      EndTime: '2026-11-30T00:00:00Z',
      syncLimitedBannerTimes: true,
    });

    expect(cloned.SeasonId).toBe('season_clone');
    expect(cloned.IsActive).toBe(false);
  });
});
