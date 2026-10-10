import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({ message: 'Nội dung tin nhắn không được để trống' })
  @IsString({ message: 'Nội dung tin nhắn phải là chuỗi' })
  @MaxLength(2000, { message: 'Nội dung tin nhắn không được vượt quá 2000 ký tự' })
  content!: string;
}
