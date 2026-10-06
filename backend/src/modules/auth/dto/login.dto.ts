import { IsString, IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  password: string;
}
