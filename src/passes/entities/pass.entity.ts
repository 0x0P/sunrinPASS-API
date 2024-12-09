import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PassType {
  EARLY_LEAVE = 'EARLY_LEAVE',
  OUTING = 'OUTING',
}

export enum PassStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity()
export class Pass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PassType,
  })
  type: PassType;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnTime: Date;

  @Column('text')
  reason: string;

  @Column({
    type: 'enum',
    enum: PassStatus,
    default: PassStatus.PENDING,
  })
  status: PassStatus;

  @Column({ nullable: true })
  rejectReason: string;

  @ManyToOne(() => User, (user) => user.studentPasses)
  student: User;

  @ManyToOne(() => User, (user) => user.teacherPasses)
  teacher: User;

  @Column({ nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  qrCodeHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
