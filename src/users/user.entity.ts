import { Product } from 'src/products/product.entity';
import { Review } from 'src/reviews/review.entity';
import { Order } from 'src/orders/entities/order.entity';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import { UserType } from 'src/utils/enums';
import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Cart } from 'src/carts/entities/cart.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'users' })
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Ahmed' })
  @Column({ type: 'varchar', length: 255 })
  username: string;

  @ApiProperty({ example: 'ahmed@gmail.com' })
  @Column({ type: 'varchar', length: 250, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @ApiProperty({ enum: UserType, default: UserType.NORMAL_USER })
  @Column({ type: 'enum', enum: UserType, default: UserType.NORMAL_USER })
  userType: UserType;

  @ApiProperty({ example: false })
  @Column({ type: 'bool', default: false })
  isAccountVerified: boolean;

  @ApiProperty({ example: 'image.png', nullable: true })
  @Column({ type: 'varchar', nullable: true, default: null })
  profileImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  verificationToken: string | null;

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

  @OneToOne(() => Cart, (cart) => cart.user, { cascade: true })
  cart: Cart;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
