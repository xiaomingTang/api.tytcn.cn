import {
  registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface,
} from 'class-validator'
import { MessageType } from 'src/constants'

@ValidatorConstraint()
class IsValidMessageTypeConstraint implements ValidatorConstraintInterface {
  validate(type: string) {
    const types: MessageType[] = [
      MessageType.File,
      MessageType.Image,
      MessageType.Text,
      MessageType.Video,
    ]
    return types.includes(type as MessageType)
  }

  defaultMessage() {
    return '消息类型有误'
  }
}

export function IsValidMessageType(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidMessageTypeConstraint,
    })
  }
}
