import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteMyDataDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu để xác nhận xóa dữ liệu' })
  password!: string;
}
