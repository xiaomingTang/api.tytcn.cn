import {
  registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint()
class IsValidPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    return !!password && password.length >= 6 && password.length <= 16
  }

  defaultMessage() {
    return '密码必须是6-16位'
  }
}

export function IsValidPassword(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPasswordConstraint,
    })
  }
}
