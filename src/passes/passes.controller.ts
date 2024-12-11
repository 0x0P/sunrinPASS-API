import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PassesService } from './passes.service';
import { CreatePassDto } from './dto/create-pass.dto';
import { ApprovePassDto } from './dto/approve-pass.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('passes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PassesController {
  constructor(private readonly passesService: PassesService) {}

  @Post('verify')
  @Roles(UserRole.TEACHER)
  async verifyPass(@Body() verifyData: { id: string; hash: string }) {
    return this.passesService.verifyPass(verifyData.id, verifyData.hash);
  }

  @Post()
  @Roles(UserRole.STUDENT)
  create(@Body() createPassDto: CreatePassDto, @CurrentUser() user: User) {
    return this.passesService.create(createPassDto, user);
  }

  @Get('my-passes')
  @Roles(UserRole.STUDENT)
  findMyPasses(@CurrentUser() user: User) {
    return this.passesService.findAllForStudent(user.id);
  }

  @Get('pending')
  @Roles(UserRole.TEACHER)
  findPendingPasses(@CurrentUser() user: User) {
    return this.passesService.findAllForTeacher(user.id);
  }

  @Post(':id/approve')
  @Roles(UserRole.TEACHER)
  async approve(
    @Param('id') id: string,
    @Body() approvePassDto: ApprovePassDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.passesService.approve(id, approvePassDto, user);
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    const pass = await this.passesService.findOne(id, user);
    return {
      id: pass.id,
      type: pass.type,
      startTime: pass.startTime,
      returnTime: pass.returnTime,
      expiresAt: pass.expiresAt,
      reason: pass.reason,
      rejectReason: pass.rejectReason,
      status: pass.status,
      student: {
        firstName: pass.student.firstName,
        lastName: pass.student.lastName,
      },
      teacher: {
        firstName: pass.teacher.firstName,
        lastName: pass.teacher.lastName,
      },
      qrCode: pass.qrCode,
    };
  }
}
