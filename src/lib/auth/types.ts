import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    perfil: string;
    username: string;
  }

  interface Session {
    user: {
      id: string;
      perfil: string;
      username: string;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    perfil: string;
    username: string;
  }
}
