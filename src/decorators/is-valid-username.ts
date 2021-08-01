import {
  registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint()
class IsValidUsernameConstraint implements ValidatorConstraintInterface {
  validate(name: string) {
    return !!name && name.length >= 3 && name.length <= 16
  }

  defaultMessage() {
    return '用户名必须是3-16位'
  }
}

export function IsValidUsername(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidUsernameConstraint,
    })
  }
}
