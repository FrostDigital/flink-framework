export interface createStripeCustomerOptions {
  userId: string;
  description?: string;
  email?: string;
  metaData?: createStripeCustomerMetaData;
  name?: string;
  phone?: string;
}

export interface createStripeCustomerMetaData {
  [key: string]: string;
}
