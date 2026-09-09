import { AppDataSource } from './data-source';
import { Dealer } from '../modules/dealers/entities/dealer.entity';
import { Distributor } from '../modules/distributors/entities/distributor.entity';
import { Product } from '../modules/products/entities/product.entity';

/**
 * Adds the TBZ pitch-call demo dataset (call script dated 2026-09-09) alongside
 * whatever is already seeded, on the existing distributor row. Safe to re-run —
 * upserts by name instead of inserting duplicates.
 *
 * Reassigns the shared live-test WhatsApp number (923246603711) from "Ali
 * Traders" to "Al-Barkat Agri Store" so the over-credit-limit escalation path
 * can be demoed live; Ali Traders gets its original placeholder number back.
 */
async function seedTbzDemo() {
  await AppDataSource.initialize();

  const distributorRepo = AppDataSource.getRepository(Distributor);
  const dealerRepo = AppDataSource.getRepository(Dealer);
  const productRepo = AppDataSource.getRepository(Product);

  const [distributor] = await distributorRepo.find({ order: { createdAt: 'ASC' }, take: 1 });
  if (!distributor) {
    throw new Error('No distributor found — run `npm run seed` first.');
  }

  const products = [
    { name: 'Sona Urea', unit: '50kg bag', price: 4450 },
    { name: 'Engro Urea', unit: '50kg bag', price: 4650 },
    { name: 'Sarsabz DAP', unit: '50kg bag', price: 14980 },
    { name: 'Sona DAP', unit: '50kg bag', price: 14849 },
    { name: 'NPK Blend (19-19-19)', unit: '50kg bag', price: 12500 },
    { name: 'Engro SOP', unit: '50kg bag', price: 16583 },
  ];

  for (const p of products) {
    const existing = await productRepo.findOne({ where: { distributorId: distributor.id, name: p.name } });
    if (existing) {
      existing.unit = p.unit;
      existing.price = p.price;
      await productRepo.save(existing);
    } else {
      await productRepo.save(productRepo.create({ ...p, distributorId: distributor.id }));
    }
  }

  // Free the live-test number from whichever dealer currently holds it, so it
  // can be reassigned below without tripping the (distributor_id, whatsapp_number)
  // unique constraint.
  const LIVE_TEST_NUMBER = '923246603711';
  const holder = await dealerRepo.findOne({
    where: { distributorId: distributor.id, whatsappNumber: LIVE_TEST_NUMBER },
  });
  if (holder && holder.name !== 'Al-Barkat Agri Store') {
    holder.whatsappNumber = '923001234567';
    await dealerRepo.save(holder);
  }

  const dealers: Array<Pick<Dealer, 'name' | 'region' | 'creditLimit' | 'currentBalance'> & {
    whatsappNumber: string;
  }> = [
    {
      name: 'Malik Traders',
      region: 'Multan',
      whatsappNumber: '923011112222',
      creditLimit: 500000,
      currentBalance: 210000,
    },
    {
      name: 'Ch. Fertilizer Store',
      region: 'Sahiwal',
      whatsappNumber: '923011113333',
      creditLimit: 300000,
      currentBalance: 285000,
    },
    {
      // Live-test dealer: intentionally already over its credit limit so any
      // order placed from this number triggers the escalation path.
      name: 'Al-Barkat Agri Store',
      region: 'Vehari',
      whatsappNumber: LIVE_TEST_NUMBER,
      creditLimit: 400000,
      currentBalance: 460000,
    },
  ];

  for (const d of dealers) {
    const existing = await dealerRepo.findOne({ where: { distributorId: distributor.id, name: d.name } });
    if (existing) {
      existing.region = d.region;
      existing.whatsappNumber = d.whatsappNumber;
      existing.creditLimit = d.creditLimit;
      existing.currentBalance = d.currentBalance;
      await dealerRepo.save(existing);
    } else {
      await dealerRepo.save(dealerRepo.create({ ...d, distributorId: distributor.id }));
    }
  }

  console.log('TBZ demo dataset seeded on distributor:', distributor.id, distributor.name);
  console.log('Live-test dealer "Al-Barkat Agri Store" is reachable at WhatsApp number:', LIVE_TEST_NUMBER);

  await AppDataSource.destroy();
}

seedTbzDemo().catch((error) => {
  console.error('TBZ demo seed failed:', error);
  process.exit(1);
});
