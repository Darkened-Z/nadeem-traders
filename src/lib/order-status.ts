export const ORDER_STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function assertOrderStatus(status: string): asserts status is OrderStatus {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid order status");
}
