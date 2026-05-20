import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from 'src/products/product.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';

@Entity({ name: 'categories' })
export class Category {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Electronics' })
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @ApiProperty({ example: 'Electronic gadgets and devices', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

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

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
