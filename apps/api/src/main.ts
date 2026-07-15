import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
async function bootstrap():Promise<void>{
 const app=await NestFactory.create<NestFastifyApplication>(AppModule,new FastifyAdapter({logger:true}));
 const config=app.get(ConfigService); await app.register(helmet);
 app.setGlobalPrefix(config.get('API_PREFIX','v1')); app.enableShutdownHooks();
 app.useGlobalPipes(new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true}));
 const doc=new DocumentBuilder().setTitle('NAP Log API').setVersion('1.0').addApiKey({type:'apiKey',name:'x-tenant-id',in:'header'},'tenant').build();
 SwaggerModule.setup('docs',app,SwaggerModule.createDocument(app,doc),{jsonDocumentUrl:'docs-json'});
 await app.listen({port:config.get('PORT',3001),host:config.get('HOST','0.0.0.0')});
} void bootstrap();
