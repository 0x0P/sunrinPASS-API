import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pass } from '../../passes/entities/pass.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  isTeacher: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @OneToMany(() => Pass, (pass) => pass.student)
  studentPasses: Pass[];

  @OneToMany(() => Pass, (pass) => pass.teacher)
  teacherPasses: Pass[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
