import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Order } from './order.entity';
import { Product } from 'src/products/product.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('order_items')
export class OrderItem {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 2 })
  @Column()
  quantity: number;

  @ApiProperty({ example: 999.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtPurchase: number;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, (product) => product.orderItems, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  product: Product;

  @ManyToOne(() => Order, (order) => order.orderItems, {
    onDelete: 'CASCADE',
  })
  order: Order;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
