import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class GlobalMaintenanceDto {
  @IsBoolean({ message: 'maintenance phải là boolean (true/false)' })
  maintenance: boolean;

  @IsString({ message: 'message phải là chuỗi ký tự' })
  @IsOptional()
  message?: string;
}
