import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { User } from '../modules/auth/entities/user.entity';
import { Dealer } from '../modules/dealers/entities/dealer.entity';
import { Distributor } from '../modules/distributors/entities/distributor.entity';
import { Product } from '../modules/products/entities/product.entity';

/**
 * Demo data for local development / early demos only — NOT for the pilot.
 * Before the pilot, replace this with the real distributor's own price
 * list and a subset of their real dealers (see README build order, step 5).
 */
async function seed() {
  await AppDataSource.initialize();

  const distributorRepo = AppDataSource.getRepository(Distributor);
  const dealerRepo = AppDataSource.getRepository(Dealer);
  const productRepo = AppDataSource.getRepository(Product);
  const userRepo = AppDataSource.getRepository(User);

  const distributor = await distributorRepo.save(
    distributorRepo.create({
      name: 'Demo Fertilizer Distributors',
      region: 'Punjab',
      whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? 'demo-phone-number-id',
    }),
  );

  await productRepo.save([
    productRepo.create({ name: 'DAP', unit: '50kg bag', price: 12500 }),
    productRepo.create({ name: 'Urea', unit: '50kg bag', price: 4200 }),
    productRepo.create({ name: 'NPK 19-19-19', unit: '50kg bag', price: 8800 }),
  ].map((p) => ({ ...p, distributorId: distributor.id })));

  await dealerRepo.save([
    dealerRepo.create({
      name: 'Ali Traders',
      whatsappNumber: '+923001234567',
      region: 'Lahore',
      creditLimit: 500000,
      currentBalance: 120000,
    }),
    dealerRepo.create({
      name: 'Malik Agri Store',
      whatsappNumber: '+923011234567',
      region: 'Faisalabad',
      creditLimit: 300000,
      currentBalance: 0,
    }),
  ].map((d) => ({ ...d, distributorId: distributor.id })));

  const passwordHash = await bcrypt.hash('changeme123', 10);
  await userRepo.save(
    userRepo.create({
      distributorId: distributor.id,
      username: 'owner',
      passwordHash,
      role: 'owner',
    }),
  );

  console.log('Seed complete.');
  console.log(`Distributor id: ${distributor.id}`);
  console.log('Dashboard login: owner / changeme123 (change this before the pilot)');

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
