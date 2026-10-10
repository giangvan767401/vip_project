import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsNotEmpty({ message: 'counselorId không được để trống' })
  @IsString({ message: 'counselorId phải là chuỗi' })
  counselorId!: string;
}
