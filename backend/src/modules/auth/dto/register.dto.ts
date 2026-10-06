import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Tên người chơi phải là chuỗi ký tự' })
  @MinLength(3, { message: 'Tên người chơi tối thiểu 3 ký tự' })
  @MaxLength(30, { message: 'Tên người chơi tối đa 30 ký tự' })
  username: string;

  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  password: string;
}
