import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServerDto {
  @IsString({ message: 'serverId phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'serverId không được để trống' })
  serverId: string;

  @IsString()
  @IsOptional()
  serverName?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
