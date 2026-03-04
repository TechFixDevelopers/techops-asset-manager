import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appUsers } from '../src/lib/db/schema';
import bcrypt from 'bcryptjs';

async function createUser() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: tsx scripts/create-user.ts <username> <password> <perfil>');
    console.log('  perfil: SAZ | LAS | ADMIN');
    console.log('Example: tsx scripts/create-user.ts soporte.pompeya pass123456 SAZ');
    process.exit(1);
  }

  const [username, password, perfil] = args;

  if (!['SAZ', 'LAS', 'ADMIN'].includes(perfil)) {
    console.error('Perfil must be SAZ, LAS, or ADMIN');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    await db.insert(appUsers).values({
      username,
      passwordHash: hashedPassword,
      perfil,
      nombre: username,
      activo: true,
    });
    console.log(`User "${username}" created with perfil "${perfil}"`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      console.error(`User "${username}" already exists`);
    } else {
      throw error;
    }
  }

  await client.end();
  process.exit(0);
}

createUser().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
