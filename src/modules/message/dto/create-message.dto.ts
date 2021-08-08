import { MessageType } from 'src/constants'
import { IsValidMessageType } from 'src/decorators/is-valid-message-type'

export class CreateMessageDto {
  readonly content: string = '';

  @IsValidMessageType()
  readonly type: MessageType = MessageType.Text;

  readonly fromUserId: string = '';

  readonly toUserIds: string[] = [];

  readonly toGroupIds: string[] = [];
}
