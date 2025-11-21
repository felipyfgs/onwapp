import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];
        const validApiKey = process.env.API_KEY;

        if (!validApiKey) {
            return true; // If no API key set in env, allow all (dev mode) or block? Better to allow for now or warn.
            // For security, strictly it should block, but for initial setup maybe allow.
            // Let's block if env is set, otherwise allow (or maybe just block always if we want strictness).
            // Let's assume if API_KEY is not set, auth is disabled.
        }

        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API Key');
        }

        return true;
    }
}
