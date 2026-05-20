import { Order } from '../../src/orders/entities/order.entity';
import { OrderItem } from '../../src/orders/entities/order-item.entity';
import { OrderStatus } from '../../src/orders/enums/order-status.enum';
import { createFakeUser } from './user.fixture';
import { createFakeProduct } from './product.fixture';

export const createFakeOrder = (overrides: Partial<Order> = {}): Order => {
  const order = new Order();
  order.id = 1;
  order.totalPrice = 199.99;
  order.status = OrderStatus.PENDING;
  order.paymobOrderId = null;
  order.created_at = new Date();
  order.updated_at = new Date();
  order.user = createFakeUser();
  order.orderItems = [];

  return { ...order, ...overrides } as Order;
};

export const createFakeOrderItem = (
  overrides: Partial<OrderItem> = {},
): OrderItem => {
  const orderItem = new OrderItem();
  orderItem.id = 1;
  orderItem.quantity = 2;
  orderItem.price = 99.99;
  orderItem.created_at = new Date();
  orderItem.updated_at = new Date();
  orderItem.order = createFakeOrder();
  orderItem.product = createFakeProduct();

  return { ...orderItem, ...overrides } as OrderItem;
};

export const createFakeOrderWithItems = (itemCount: number = 2): Order => {
  const order = createFakeOrder();
  order.orderItems = Array.from({ length: itemCount }, (_, index) =>
    createFakeOrderItem({
      id: index + 1,
      quantity: index + 1,
      price: 99.99 + index * 10,
      order,
      product: createFakeProduct({
        id: index + 1,
        title: `Product ${index + 1}`,
      }),
    }),
  );
  order.totalPrice = order.orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return order;
};

export const createFakePaidOrder = (overrides: Partial<Order> = {}): Order => {
  return createFakeOrder({
    status: OrderStatus.PAID,
    paymobOrderId: 'paymob_123456',
    ...overrides,
  });
};
