import { NotFoundException } from '@nestjs/common';
import { PlayersController } from './players.controller.js';
import { PlayersService } from './players.service.js';

describe('PlayersService & PlayersController', () => {
  let service: PlayersService;
  let controller: PlayersController;

  beforeEach(() => {
    service = new PlayersService();
    controller = new PlayersController(service);
  });

  it('findAll trả về danh sách rỗng và thông điệp chuẩn', async () => {
    const res = await controller.findAll();
    expect(res).toEqual({ data: [], message: 'Get all players' });
  });

  it('findOne ném NotFoundException khi không tìm thấy người chơi', async () => {
    await expect(controller.findOne('p_999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create khởi tạo bản ghi người chơi mới với thời gian tạo', async () => {
    const res = await controller.create({
      username: 'Commander_Veyra',
      email: 'cmd@veyra.game',
    });
    expect(res.id).toBe('new-id');
    expect(res.username).toBe('Commander_Veyra');
    expect(res.email).toBe('cmd@veyra.game');
    expect(res.createdAt).toBeInstanceOf(Date);
  });

  it('remove trả về thông báo đã xóa người chơi', async () => {
    const res = await controller.remove('p_101');
    expect(res).toEqual({ message: 'Player #p_101 removed' });
  });
});
