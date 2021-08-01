import * as helmet from 'helmet'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionFilter } from './filters/all-exception.filter'
import { HttpExceptionFilter } from './filters/http-exception.filter'
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor'
import { ValidationPipe } from './shared/pipes/validation.pipe'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  /**
   * Helmet can help protect your app from some well-known
   * web vulnerabilities by setting HTTP headers appropriately.
   * Generally, Helmet is just a collection of 12 smaller
   * middleware functions that set security-related HTTP headers
   *
   * https://github.com/helmetjs/helmet#how-it-works
   */
  app.use(helmet())

  app.enableCors()

  // /**
  //  * we need this because "cookie" is true in csrfProtection
  //  */
  // app.use(cookieParser());

  // app.use(csurf({ cookie: true }));

  app.useGlobalFilters(new AllExceptionFilter(), new HttpExceptionFilter())

  app.useGlobalInterceptors(new TransformResponseInterceptor())

  app.useGlobalPipes(new ValidationPipe())

  await app.listen(3000)

  console.log(`run at ${await app.getUrl()}/user/`)
}

bootstrap()
