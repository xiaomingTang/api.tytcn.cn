import {
  ArgumentMetadata, BadRequestException, Injectable, PipeTransform, ValidationError,
} from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('No data submitted')
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const types: Function[] = [String, Boolean, Number, Array, Object]
    if (!metatype || types.includes(metatype)) {
      return value
    }

    const object = plainToClass(metatype, value)
    const errors = await validate(object)
    if (errors.length > 0) {
      throw new BadRequestException(this.flattenErrors(errors))
    }

    return value
  }

  private flattenErrors(errors: ValidationError[]): string {
    let i = 0
    return errors.reduce((prev, cur) => {
      const errContents = Object.values(cur.constraints || {}).map((content) => {
        i += 1
        return `${i}. ${content};`
      })
      return prev.concat(errContents)
    }, ['验证失败:']).join(' ')
  }
}
