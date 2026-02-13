import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { PipelineExecutionService } from './pipeline-execution.service';

@Controller('api/v1/pipelines')
export class PipelinesController {
  constructor(
    private readonly service: PipelinesService,
    private readonly executionService: PipelineExecutionService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  /** Execute a specific pipeline with input data */
  @Post(':id/execute')
  execute(
    @Param('id') id: string,
    @Body() body: { data: any },
  ) {
    return this.executionService.execute(id, body.data ?? body);
  }

  /** Auto-route: find the best matching pipeline and execute it */
  @Post('route/execute')
  async routeAndExecute(
    @Body() body: {
      productLine: string;
      sourceSystem: string;
      transactionType?: string;
      data: any;
    },
  ) {
    const pipeline = await this.executionService.route(
      body.productLine,
      body.sourceSystem,
      body.transactionType,
    );
    if (!pipeline) {
      return {
        success: false,
        error: `No active pipeline found for productLine=${body.productLine} sourceSystem=${body.sourceSystem}`,
      };
    }
    return this.executionService.execute(pipeline.id, body.data);
  }
}
