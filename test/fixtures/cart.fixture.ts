import { Cart } from '../../src/carts/entities/cart.entity';
import { CartItem } from '../../src/carts/entities/cart-item.entity';
import { createFakeUser } from './user.fixture';
import { createFakeProduct } from './product.fixture';

export const createFakeCart = (overrides: Partial<Cart> = {}): Cart => {
  const cart = new Cart();
  cart.id = 1;
  cart.created_at = new Date();
  cart.updated_at = new Date();
  cart.user = createFakeUser();
  cart.cartItems = [];

  return { ...cart, ...overrides } as Cart;
};

export const createFakeCartItem = (
  overrides: Partial<CartItem> = {},
): CartItem => {
  const cartItem = new CartItem();
  cartItem.id = 1;
  cartItem.quantity = 2;
  cartItem.created_at = new Date();
  cartItem.updated_at = new Date();
  cartItem.cart = createFakeCart();
  cartItem.product = createFakeProduct();

  return { ...cartItem, ...overrides } as CartItem;
};

export const createFakeCartWithItems = (itemCount: number = 2): Cart => {
  const cart = createFakeCart();
  cart.cartItems = Array.from({ length: itemCount }, (_, index) =>
    createFakeCartItem({
      id: index + 1,
      quantity: index + 1,
      cart,
      product: createFakeProduct({
        id: index + 1,
        title: `Product ${index + 1}`,
      }),
    }),
  );
  return cart;
};
