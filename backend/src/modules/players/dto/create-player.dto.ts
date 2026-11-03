import { IsString, IsEmail, IsOptional, IsInt, Min } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
