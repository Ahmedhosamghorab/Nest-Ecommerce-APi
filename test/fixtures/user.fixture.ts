import { User } from '../../src/users/user.entity';
import { UserType } from '../../src/utils/enums';

export const createFakeUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = 1;
  user.username = 'testuser';
  user.email = 'test@example.com';
  user.password = 'hashedpassword';
  user.userType = UserType.NORMAL_USER;
  user.isAccountVerified = false;
  user.verificationToken = 'token';
  user.profileImage = null;
  user.reviews = [];
  user.cart = null;
  user.orders = [];

  return { ...user, ...overrides } as User;
};

export const createFakeAdmin = (overrides: Partial<User> = {}): User => {
  return createFakeUser({
    id: 2,
    username: 'admin',
    email: 'admin@example.com',
    userType: UserType.ADMIN,
    ...overrides,
  });
};
