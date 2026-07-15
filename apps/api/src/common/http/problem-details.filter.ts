import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const status = error instanceof HttpException
      ? error.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody = error instanceof HttpException ? error.getResponse() : undefined;
    const detail = typeof exceptionBody === 'string'
      ? exceptionBody
      : this.detailFromObject(exceptionBody) ?? 'Unexpected server error';

    response.status(status).type('application/problem+json').send({
      type: `https://httpstatuses.com/${status}`,
      title: HttpStatus[status] ?? 'Error',
      status,
      detail,
      instance: request.url,
    });
  }

  private detailFromObject(body: object | undefined): string | string[] | undefined {
    if (!body || !('message' in body)) return undefined;
    const message = body.message;
    return typeof message === 'string' || Array.isArray(message) ? message : undefined;
  }
}
