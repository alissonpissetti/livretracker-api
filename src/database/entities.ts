import { Device } from '../devices/entities/device.entity';
import { Location } from '../locations/entities/location.entity';
import { LoginOtp } from '../auth/entities/login-otp.entity';
import { OrderItem } from '../store/entities/order-item.entity';
import { Order } from '../store/entities/order.entity';
import { Product } from '../store/entities/product.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { TrackingShare } from '../tracking-shares/entities/tracking-share.entity';
import { User } from '../users/entities/user.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';

/** Registro único de entidades — usado por TypeORM e migrations. */
export const databaseEntities = [
  Location,
  Device,
  Product,
  User,
  LoginOtp,
  Voucher,
  Order,
  OrderItem,
  Subscription,
  TrackingShare,
] as const;
