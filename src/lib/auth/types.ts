import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    perfil: string;
    username: string;
    permisos?: { modulosHabilitados?: string[] } | null;
  }

  interface Session {
    user: {
      id: string;
      perfil: string;
      username: string;
      permisos?: { modulosHabilitados?: string[] } | null;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    perfil: string;
    username: string;
    permisos?: { modulosHabilitados?: string[] } | null;
  }
}
