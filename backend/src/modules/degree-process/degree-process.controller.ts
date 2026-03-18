import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { DegreeProcessService } from './degree-process.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { AssignAdvisorDto } from './dto/assign-advisor.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ProcessFilterDto } from './dto/process-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../../shared/decorators/current-user.decorator';

/**
 * Controller for degree process endpoints
 * Manages student inscriptions to degree modalities
 */
@ApiTags('Degree Processes')
@Controller('degree-processes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DegreeProcessController {
  constructor(private degreeProcessService: DegreeProcessService) {}

  /**
   * Create a new degree process
   * Student inscription starts in DRAFT status
   */
  @Post()
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new degree process',
    description:
      'Student submits inscription to a degree modality. Process starts in DRAFT status.',
  })
  @ApiBody({ type: CreateProcessDto })
  @ApiResponse({
    status: 201,
    description: 'Degree process created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or business rule violation',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student or modality not found' })
  async createProcess(
    @Body() createProcessDto: CreateProcessDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.degreeProcessService.createProcess(user.sub, createProcessDto);
  }

  /**
   * Get all degree processes with filtering and pagination
   * Only accessible to secretaries and admins
   */
  @Get()
  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all degree processes',
    description:
      'Retrieve all degree processes with filtering and pagination. Secretary/Admin only.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'ACTIVE', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'ARCHIVED'] })
  @ApiQuery({ name: 'modalityCode', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'advisorId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Degree processes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllProcesses(@Query() filters: ProcessFilterDto) {
    return this.degreeProcessService.getAllProcesses(filters);
  }

  /**
   * Get my processes
   * Students see their own, advisors see assigned ones
   */
  @Get('my-processes')
  @Roles(UserRole.STUDENT, UserRole.ADVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my processes',
    description:
      'Students retrieve their own processes, professors retrieve assigned ones.',
  })
  @ApiResponse({
    status: 200,
    description: 'Processes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProcesses(@CurrentUser() user: JwtPayload) {
    if (user.role === UserRole.STUDENT) {
      return this.degreeProcessService.getProcessesByStudent(user.sub);
    } else {
      return this.degreeProcessService.getProcessesByAdvisor(user.sub);
    }
  }

  /**
   * Get a specific degree process by ID
   * Permission-based access control
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get degree process by ID',
    description:
      'Retrieve a specific degree process. Access controlled by role and process ownership.',
  })
  @ApiResponse({
    status: 200,
    description: 'Degree process retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Process not found' })
  async getProcessById(
    @Param('id') processId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.degreeProcessService.getProcessById(
      processId,
      user.sub,
      user.role,
    );
  }

  /**
   * Assign an advisor to a degree process
   * Secretary/Admin only
   */
  @Patch(':id/assign-advisor')
  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign advisor to process',
    description:
      'Secretary/Admin assigns an advisor to a degree process. Validates advisor availability.',
  })
  @ApiBody({ type: AssignAdvisorDto })
  @ApiResponse({
    status: 200,
    description: 'Advisor assigned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or business rule violation',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Process or advisor not found' })
  async assignAdvisor(
    @Param('id') processId: string,
    @Body() assignAdvisorDto: AssignAdvisorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.degreeProcessService.assignAdvisor(
      processId,
      assignAdvisorDto,
      user.sub,
    );
  }

  /**
   * Activate a degree process
   * Transitions DRAFT → ACTIVE (student submission)
   */
  @Patch(':id/activate')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate degree process',
    description:
      'Student submits inscription. Transitions process from DRAFT to ACTIVE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Process activated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid state transition or missing advisor',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Process not found' })
  async activateProcess(
    @Param('id') processId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.degreeProcessService.activateProcess(processId, user.sub);
  }

  /**
   * Update process status
   * Role-dependent state transitions
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update process status',
    description:
      'Update the status of a degree process. State transitions validated by role.',
  })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid state transition',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Process not found' })
  async updateProcessStatus(
    @Param('id') processId: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.degreeProcessService.updateProcessStatus(
      processId,
      updateStatusDto,
      user.sub,
      user.role,
    );
  }

  /**
   * Get process summary with completion metrics
   */
  @Get(':id/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get process summary',
    description:
      'Retrieve summary of degree process with completion percentages and requirement status counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Process summary retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Process not found' })
  async getProcessSummary(@Param('id') processId: string) {
    return this.degreeProcessService.getProcessSummary(processId);
  }
}
