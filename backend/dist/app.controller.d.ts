import { AppService } from './app.service.js';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getStatus(): {
        message: string;
        version: string;
        timestamp: string;
    };
    healthCheck(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
    };
}
