import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = this.extractApiKey(request);

        if (!apiKey) {
            throw new UnauthorizedException('API key is missing');
        }

        const validApiKey = process.env.GLOBAL_API_KEY;

        if (!validApiKey) {
            throw new Error('GLOBAL_API_KEY environment variable is not set');
        }

        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        return true;
    }

    private extractApiKey(request: Request): string | undefined {
        // Check X-API-Key header
        const headerKey = request.headers['x-api-key'];
        if (headerKey) {
            return Array.isArray(headerKey) ? headerKey[0] : headerKey;
        }

        // Check Authorization Bearer token
        const authorization = request.headers.authorization;
        if (authorization?.startsWith('Bearer ')) {
            return authorization.substring(7);
        }

        return undefined;
    }
}
