import { Review } from 'src/reviews/review.entity';
import { User } from 'src/users/user.entity';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { ProductImage } from './product_image.entity';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from 'src/categories/entities/category.entity';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'iPhone 15' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 'Latest Apple smartphone' })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ApiProperty({ example: 999.99 })
  @Column({ type: 'float' })
  price: number;

  @ApiProperty({ example: 10 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty()
  @CreateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
  })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;

  @ApiProperty({ type: () => Review, isArray: true })
  @OneToMany(() => Review, (review) => review.product, { eager: true })
  reviews: Review[];

  @ApiProperty({ type: () => ProductImage, isArray: true })
  @OneToMany(() => ProductImage, (image) => image.product, {
    eager: true,
    cascade: true,
  })
  images: ProductImage[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.products, { eager: true })
  user: User;

  @ApiProperty({ type: () => Category, nullable: true })
  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category | null;
}
