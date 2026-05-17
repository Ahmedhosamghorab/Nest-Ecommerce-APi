import { UserType } from './enums';

export type JWTPayload = {
  id: number;
  userType: UserType;
};

export type AccessToken = {
  accessToken: string;
};
export type MessageResponse = {
  message: string;
};
export type CheckoutResponse = {
  paymentUrl: string;
  orderId: number;
};
export interface PaymobWebhookPayload {
  type: string;
  obj: {
    id: number;
    pending: boolean;
    success: boolean;
    amount_cents: number;
    currency: string;
    created_at: string;
    error_occured: boolean;
    has_parent_transaction: boolean;
    integration_id: number;
    is_3d_secure: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_refunded: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    order: {
      id: number;
      merchant_order_id: string | null;
    };
    source_data: {
      pan: string;
      sub_type: string;
      type: string;
    };
    data: {
      message: string;
    };
    special_reference?: string;
  };
}

export interface BillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment: string;
  floor: string;
  street: string;
  building: string;
  city: string;
  country: string;
}

export interface IntentionResponse {
  id: string;
  client_secret: string;
  payment_methods: number[];
  amount: number;
  currency: string;
  special_reference: string;
}
