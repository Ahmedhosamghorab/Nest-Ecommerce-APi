import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { User } from 'src/users/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('orders')
export class Order {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1999.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.PENDING })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: '1234567', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  paymobOrderId: string;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ApiProperty({ type: () => OrderItem, isArray: true })
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  orderItems: OrderItem[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
