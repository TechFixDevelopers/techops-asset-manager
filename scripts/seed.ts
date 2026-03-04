import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { empresas, sitios, appUsers } from '../src/lib/db/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set. Copy .env.local.example to .env.local and configure it.');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log('Seeding empresas...');
  await db
    .insert(empresas)
    .values([
      { nombre: 'Cerveceria y Malteria Quilmes', codigo: 'CMQ' },
      { nombre: 'FNC', codigo: 'FNC' },
      { nombre: 'Pampa', codigo: 'PAMPA' },
      { nombre: 'Nestle', codigo: 'NESTLE' },
      { nombre: 'Cympay', codigo: 'CYMPAY' },
    ])
    .onConflictDoNothing();

  console.log('Seeding sitios...');
  await db
    .insert(sitios)
    .values([
      { nombre: 'Estructura Central', tipo: 'Oficina' },
      { nombre: 'Planta Pompeya', tipo: 'Planta' },
      { nombre: 'CD Mercado Central', tipo: 'CD' },
      { nombre: 'Planta Zarate', tipo: 'Planta' },
      { nombre: 'Planta Quilmes', tipo: 'Planta' },
      { nombre: 'Planta Corrientes', tipo: 'Planta' },
      { nombre: 'Planta Tucuman', tipo: 'Planta' },
      { nombre: 'Planta Mendoza', tipo: 'Planta' },
      { nombre: 'CD Rosario', tipo: 'CD' },
      { nombre: 'CD Cordoba', tipo: 'CD' },
      { nombre: 'Oficina Parana', tipo: 'Oficina' },
      { nombre: 'Planta Tres Arroyos', tipo: 'Planta' },
      { nombre: 'Planta Puan', tipo: 'Planta' },
      { nombre: 'CD La Plata', tipo: 'CD' },
      { nombre: 'Planta Llavallol', tipo: 'Planta' },
    ])
    .onConflictDoNothing();

  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('changeme123', 12);
  await db
    .insert(appUsers)
    .values({
      username: 'admin',
      passwordHash: hashedPassword,
      perfil: 'ADMIN',
      nombre: 'Administrador',
      email: 'admin@techops.local',
      activo: true,
    })
    .onConflictDoNothing();

  console.log('Seed completed successfully!');
  await client.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
