import "next-auth";

declare module "next-auth" {
  interface User {
    isSuperAdmin?: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      isSuperAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isSuperAdmin?: boolean;
  }
}
