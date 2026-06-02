import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('health')
@Controller('api/v2/health')
export class HealthController {

    @ApiOperation({ summary: 'Health check - stable version' })
    @ApiResponse({ status: 200, description: 'Service status' })
    @Get()
    check() {
        return {
            status: 'stable',
            version: '2.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }
}