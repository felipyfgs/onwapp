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

        const validApiKey = process.env.API_KEY;

        if (!validApiKey) {
            throw new Error('API_KEY environment variable is not set');
        }

        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        return true;
    }

    private extractApiKey(request: Request): string | undefined {
        // Check apikey header (primary method)
        const apikey = request.headers['apikey'];
        if (apikey) {
            return Array.isArray(apikey) ? apikey[0] : apikey;
        }

        // Check X-API-Key header (backward compatibility)
        const headerKey = request.headers['x-api-key'];
        if (headerKey) {
            return Array.isArray(headerKey) ? headerKey[0] : headerKey;
        }

        // Check Authorization Bearer token (backward compatibility)
        const authorization = request.headers.authorization;
        if (authorization?.startsWith('Bearer ')) {
            return authorization.substring(7);
        }

        return undefined;
    }
}
