import "next-auth";
import "next-auth/jwt";

/**
 * Module augmentation for next-auth.
 * Extends the default Session and JWT types to include the `id` field
 * that the [...nextauth] callbacks inject at runtime.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
