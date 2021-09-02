import { IsNotEmpty } from 'class-validator'
import { MessageType } from 'src/constants'
import { IsValidMessageType } from 'src/decorators/is-valid-message-type'

export class CreateMessageDto {
  @IsNotEmpty({
    message: '消息内容不得为空',
  })
  readonly content: string;

  @IsValidMessageType()
  readonly type: MessageType;

  @IsNotEmpty({
    message: '发送者id不得为空',
  })
  readonly fromUserId: string;

  readonly toUserId?: string;

  readonly toGroupId?: string;
}
