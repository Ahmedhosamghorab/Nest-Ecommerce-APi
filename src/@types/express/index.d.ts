import { JWTPayload } from '../../utils/types';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends JWTPayload {}
    interface Request {
      user?: User;
    }
  }
}
