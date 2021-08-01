import {
  registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint()
class IsValidGroupnameConstraint implements ValidatorConstraintInterface {
  validate(name: string) {
    return !!name && name.length >= 3 && name.length <= 16
  }

  defaultMessage() {
    return '群组名必须是3-16位'
  }
}

export function IsValidGroupname(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidGroupnameConstraint,
    })
  }
}
