import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pass, PassType, PassStatus } from './entities/pass.entity';
import { CreatePassDto } from './dto/create-pass.dto';
import { ApprovePassDto } from './dto/approve-pass.dto';
import { User } from '../users/entities/user.entity';
import { QRCodeUtil } from '../common/utils/qr-code.util';

@Injectable()
export class PassesService {
  constructor(
    @InjectRepository(Pass)
    private readonly passRepository: Repository<Pass>,
    private readonly qrCodeUtil: QRCodeUtil,
  ) {}

  private calculateExpirationDate(
    type: PassType,
    startTime: Date,
    returnTime: Date | null,
  ): Date {
    if (type === PassType.OUTING && returnTime) {
      // 외출증은 귀가 시간이 만료 시간
      return new Date(returnTime);
    } else if (type === PassType.EARLY_LEAVE) {
      // 조퇴증은 시작 시간 날짜의 자정이 만료 시간
      const expirationDate = new Date(startTime);
      expirationDate.setHours(23, 59, 59, 999);
      return expirationDate;
    } else {
      // 기타 케이스는 당일 자정
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay;
    }
  }

  private isExpired(pass: Pass): boolean {
    const now = new Date();
    const expiresAt = new Date(pass.expiresAt);
    return now > expiresAt;
  }

  private processPassStatus(pass: Pass): Pass {
    if (pass.status === PassStatus.APPROVED && this.isExpired(pass)) {
      pass.status = PassStatus.EXPIRED;
    }
    return pass;
  }

  async create(createPassDto: CreatePassDto, student: User): Promise<Pass> {
    const startTime = new Date(createPassDto.startTime);
    const returnTime = createPassDto.returnTime
      ? new Date(createPassDto.returnTime)
      : null;

    const pass = this.passRepository.create({
      ...createPassDto,
      startTime,
      returnTime,
      student,
      teacher: { id: createPassDto.teacherId },
      expiresAt: this.calculateExpirationDate(
        createPassDto.type,
        startTime,
        returnTime,
      ),
    });

    const savedPass = await this.passRepository.save(pass);
    const passWithRelations = await this.findOne(savedPass.id, student);
    const { qrCode, hash } =
      await this.qrCodeUtil.generateQRCode(passWithRelations);

    passWithRelations.qrCode = qrCode;
    passWithRelations.qrCodeHash = hash;

    return await this.passRepository.save(passWithRelations);
  }

  async findAllForStudent(studentId: string): Promise<Pass[]> {
    const passes = await this.passRepository.find({
      where: [
        {
          student: { id: studentId },
          status: PassStatus.PENDING,
        },
        {
          student: { id: studentId },
          status: PassStatus.APPROVED,
        },
      ],
      relations: ['student', 'teacher'],
      order: { createdAt: 'DESC' },
    });

    return passes.map((pass) => this.processPassStatus(pass));
  }

  async findAllForTeacher(teacherId: string): Promise<Pass[]> {
    const passes = await this.passRepository.find({
      where: {
        teacher: { id: teacherId },
        status: PassStatus.PENDING,
      },
      relations: ['student', 'teacher'],
      order: { createdAt: 'DESC' },
    });

    return passes.map((pass) => this.processPassStatus(pass));
  }

  async findOne(id: string, user: User): Promise<Pass> {
    const pass = await this.passRepository.findOne({
      where: { id },
      relations: ['student', 'teacher'],
      cache: false,
    });

    if (!pass) {
      throw new NotFoundException(`패스 : "${id}" 를 찾을 수 없음`);
    }

    if (pass.student.id !== user.id && pass.teacher.id !== user.id) {
      throw new ForbiddenException('권한 없음');
    }

    return this.processPassStatus(pass);
  }

  async approve(
    id: string,
    approvePassDto: ApprovePassDto,
    teacher: User,
  ): Promise<Pass> {
    return await this.passRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const pass = await transactionalEntityManager
          .createQueryBuilder(Pass, 'pass')
          .innerJoinAndSelect('pass.student', 'student')
          .innerJoinAndSelect('pass.teacher', 'teacher')
          .where('pass.id = :id', { id })
          .setLock('pessimistic_write')
          .getOne();

        if (!pass) {
          throw new NotFoundException(`패스 : "${id}" 를 찾을 수 없음`);
        }

        if (pass.teacher.id !== teacher.id) {
          throw new ForbiddenException('승인 권한 없음');
        }

        if (pass.status !== PassStatus.PENDING) {
          throw new BadRequestException('이미 처리된 패스');
        }

        const now = new Date();
        if (now > new Date(pass.startTime)) {
          throw new BadRequestException('과거를 등록할 수 없음');
        }

        pass.status = approvePassDto.status;
        if (approvePassDto.status === PassStatus.REJECTED) {
          pass.rejectReason = approvePassDto.rejectReason;
        }

        await transactionalEntityManager.save(Pass, pass);

        const updatedPass = await transactionalEntityManager
          .createQueryBuilder(Pass, 'pass')
          .innerJoinAndSelect('pass.student', 'student')
          .innerJoinAndSelect('pass.teacher', 'teacher')
          .where('pass.id = :id', { id })
          .getOne();

        return this.processPassStatus(updatedPass);
      },
    );
  }

  async verifyPass(
    id: string,
    hash: string,
  ): Promise<{ isValid: boolean; status: PassStatus }> {
    return await this.passRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const pass = await transactionalEntityManager
          .createQueryBuilder(Pass, 'pass')
          .where('pass.id = :id', { id })
          .setLock('pessimistic_write')
          .getOne();

        if (!pass) {
          throw new NotFoundException(`패스 : "${id}" 를 찾을 수 없음`);
        }

        if (pass.status !== PassStatus.APPROVED) {
          return {
            isValid: false,
            status: pass.status,
          };
        }

        if (this.isExpired(pass)) {
          pass.status = PassStatus.EXPIRED;
          await transactionalEntityManager.save(Pass, pass);
          return {
            isValid: false,
            status: PassStatus.EXPIRED,
          };
        }

        const computedHash = this.qrCodeUtil.generateHash(id);
        const isValid = computedHash === hash;

        if (isValid) {
          pass.status = PassStatus.EXPIRED;
          await transactionalEntityManager.save(Pass, pass);
        }

        return {
          isValid,
          status: pass.status,
        };
      },
    );
  }
}
