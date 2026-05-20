import { Product } from 'src/products/product.entity';
import { User } from 'src/users/user.entity';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'reviews' })
export class Review {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 5 })
  @Column({ type: 'int' })
  rate: number;

  @ApiProperty({ example: 'Great product!' })
  @Column({ type: 'varchar', length: 255 })
  comment: string;

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

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.reviews, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;
}
