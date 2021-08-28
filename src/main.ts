import * as helmet from 'helmet'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionFilter } from './filters/all-exception.filter'
import { HttpExceptionFilter } from './filters/http-exception.filter'
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor'
import { ValidationPipe } from './shared/pipes/validation.pipe'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  const config = new DocumentBuilder()
    .setTitle('tytcn.cn 后端 api 接口文档')
    .setDescription('tytcn.cn 后端 api')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('doc', app, document)

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

  console.log(`run at ${await app.getUrl()}/`)
}

bootstrap()
