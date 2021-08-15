import { MessageType } from 'src/constants'

export class GetMessagesDto {
  fromUserId?: string;

  toUserId?: string;

  toGroupId?: string;

  content?: string;

  type?: MessageType;
}
