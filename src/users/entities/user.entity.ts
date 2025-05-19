import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  PARTNER = 'partner',
  DEVELOPER = 'developer',
  DEMO = 'demo',
  ADMIN = 'admin',
  CREATOR = 'creator',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @Column()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER, description: 'User role' })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ example: 'true', description: 'Whether the user is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Account creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Account last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @Column()
  password: string;

  @Exclude()
  @Column({ nullable: true })
  refreshToken?: string;
} 