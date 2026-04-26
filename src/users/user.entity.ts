import { Product } from 'src/products/product.entity';
import { Review } from 'src/reviews/review.entity';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import { UserType } from 'src/utils/enums';
import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 255 })
  username: string;
  @Column({ type: 'varchar', length: 250, unique: true })
  email: string;
  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;
  @Column({ type: 'enum', enum: UserType, default: UserType.NORMAL_USER })
  userType: UserType;
  @Column({ type: 'bool', default: false })
  isAccountVerified: boolean;
  @Column({ type: 'varchar', nullable: true, default: null })
  profileImage: string | null;
  @Column({ nullable: true })
  verificationToken: string | null;
  @CreateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;
  @OneToMany(() => Product, (product) => product.user)
  products: Product[];
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
}
