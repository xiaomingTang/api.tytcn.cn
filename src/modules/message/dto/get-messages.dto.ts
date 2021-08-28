import { MessageType } from 'src/constants'

export class GetMessagesDto {
  readonly fromUserId?: string;

  readonly toUserId?: string;

  readonly toGroupId?: string;

  readonly content?: string;

  readonly type?: MessageType;
}
