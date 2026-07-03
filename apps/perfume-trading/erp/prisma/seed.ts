import { PrismaClient } from '@prisma/client'
import "dotenv/config"

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // Clean up existing data
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.tradingItem.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.partner.deleteMany()
  await prisma.product.deleteMany()
  await prisma.brand.deleteMany()

  // ─── Brands ───
  const brands = [
    { name: 'Chanel', category: 'Luxury', country: 'France' },
    { name: 'Dior', category: 'Luxury', country: 'France' },
    { name: 'Creed', category: 'Niche', country: 'United Kingdom' },
    { name: 'Tom Ford', category: 'Luxury', country: 'USA' },
    { name: 'Lancôme', category: 'Luxury', country: 'France' },
    { name: 'Jo Malone', category: 'Luxury', country: 'United Kingdom' },
    { name: 'Prada', category: 'Luxury', country: 'Italy' },
    { name: 'Yves Saint Laurent', category: 'Luxury', country: 'France' },
    { name: 'Maison Francis Kurkdjian', category: 'Niche', country: 'France' },
    { name: 'Byredo', category: 'Niche', country: 'Sweden' },
  ];

  const brandMap = new Map()
  for (const b of brands) {
    const brand = await prisma.brand.create({ data: b })
    brandMap.set(b.name, brand.id)
  }

  // ─── Products ───
  const products = [
    { brandId: brandMap.get('Chanel'), name: 'Bleu de Chanel', line: 'Les Exclusifs', gender: 'Male', format: 'Regular', concentration: 'EDP', sizeMl: 100, ean: '3145891073607', marketPrice: 135.00, costPrice: 78.50 },
    { brandId: brandMap.get('Chanel'), name: 'Coco Mademoiselle', line: 'Les Exclusifs', gender: 'Female', format: 'Regular', concentration: 'EDP', sizeMl: 50, ean: '3145891033007', marketPrice: 120.00, costPrice: 72.00 },
    { brandId: brandMap.get('Dior'), name: 'Sauvage', line: 'Collection Privée', gender: 'Male', format: 'Tester', concentration: 'EDT', sizeMl: 100, ean: '3348901250141', marketPrice: 82.00, costPrice: 62.00 },
    { brandId: brandMap.get('Dior'), name: 'J\'adore', line: 'Collection Privée', gender: 'Female', format: 'Regular', concentration: 'EDP', sizeMl: 50, ean: '3348901267897', marketPrice: 110.00, costPrice: 68.00 },
    { brandId: brandMap.get('Creed'), name: 'Aventus', line: 'Creed Signature', gender: 'Male', format: 'Regular', concentration: 'EDP', sizeMl: 100, ean: '3508441001114', marketPrice: 320.00, costPrice: 245.00 },
    { brandId: brandMap.get('Creed'), name: 'Green Irish Tweed', line: 'Creed Signature', gender: 'Male', format: 'Regular', concentration: 'EDP', sizeMl: 100, ean: '3508441000568', marketPrice: 290.00, costPrice: 220.00 },
    { brandId: brandMap.get('Tom Ford'), name: 'Ombre Leather', line: 'Private Blend', gender: 'Male', format: 'Regular', concentration: 'EDP', sizeMl: 100, ean: '888066000512', marketPrice: 235.00, costPrice: 110.00 },
    { brandId: brandMap.get('Tom Ford'), name: 'Black Orchid', line: 'Private Blend', gender: 'Unisex', format: 'Regular', concentration: 'EDP', sizeMl: 50, ean: '888066000314', marketPrice: 180.00, costPrice: 95.00 },
    { brandId: brandMap.get('Lancôme'), name: 'La Vie Est Belle', line: 'Maison Lancôme', gender: 'Female', format: 'Regular', concentration: 'EDP', sizeMl: 75, ean: '3605532612836', marketPrice: 95.00, costPrice: 72.00 },
    { brandId: brandMap.get('Jo Malone'), name: 'Wood Sage & Sea Salt', line: 'Cologne Collection', gender: 'Unisex', format: 'Regular', concentration: 'EDC', sizeMl: 100, ean: '5013515100160', marketPrice: 105.00, costPrice: 88.00 },
    { brandId: brandMap.get('Prada'), name: 'Luna Rossa Carbon', line: 'Luna Rossa', gender: 'Male', format: 'Tester', concentration: 'EDT', sizeMl: 150, ean: '3348901400126', marketPrice: 110.00, costPrice: 95.00 },
    { brandId: brandMap.get('Yves Saint Laurent'), name: 'Libre', line: 'Libre Collection', gender: 'Female', format: 'Regular', concentration: 'EDP', sizeMl: 90, ean: '3614273456789', marketPrice: 130.00, costPrice: 105.00 },
    { brandId: brandMap.get('Maison Francis Kurkdjian'), name: 'Baccarat Rouge 540', line: 'MFK Collection', gender: 'Unisex', format: 'Regular', concentration: 'EDP', sizeMl: 70, ean: '3700409800012', marketPrice: 300.00, costPrice: 225.00 },
    { brandId: brandMap.get('Byredo'), name: 'Gypsy Water', line: 'Byredo Signature', gender: 'Unisex', format: 'Regular', concentration: 'EDP', sizeMl: 50, ean: '7340018701234', marketPrice: 190.00, costPrice: 140.00 },
  ];

  const productMap = new Map()
  for (const p of products) {
    const product = await prisma.product.create({ data: p })
    productMap.set(p.ean, product.id)
  }

  // ─── Partners ───
  const partners = [
    { name: 'GlobalFragance GmbH', type: 'Supplier', email: 'info@globalfragance.de', phone: '+49 30 1234 5678', country: 'Alemania', creditLimit: 75000, paymentTerms: 'Net 45' },
    { name: 'Parfums World SA', type: 'Both', email: 'sales@parfumsworld.fr', phone: '+33 1 2345 6789', country: 'Francia', creditLimit: 100000, paymentTerms: 'Net 60' },
    { name: 'Luxury Scents Ltd', type: 'Supplier', email: 'contact@luxuryscents.uk', phone: '+44 20 7123 4567', country: 'Reino Unido', creditLimit: 50000, paymentTerms: 'Net 30' },
    { name: 'Aroma Select SL', type: 'Client', email: 'compras@aromaselect.es', phone: '+34 91 2345 678', country: 'España', creditLimit: 25000, paymentTerms: 'Net 30' },
    { name: 'Beauty Distribution Inc', type: 'Client', email: 'orders@beautydist.com', phone: '+1 212 555 0199', country: 'USA', creditLimit: 150000, paymentTerms: 'Net 30' },
    { name: 'Scents Global Brokers AG', type: 'Broker', email: 'trading@scentsglobal.ch', phone: '+41 22 345 6789', country: 'Suiza', creditLimit: 50000, paymentTerms: 'Net 15', brokerFeePct: 2.50 },
    { name: 'Orient Perfumes FZE', type: 'Broker', email: 'info@orientperfumes.ae', phone: '+971 4 234 5678', country: 'EAU', creditLimit: 30000, paymentTerms: 'Net 15', brokerFeePct: 3.00 },
  ];

  const partnerMap = new Map()
  for (const p of partners) {
    const partner = await prisma.partner.create({ data: p })
    partnerMap.set(p.name, partner.id)
  }

  // ─── Warehouses ───
  const warehouses = [
    { name: 'Almacén Central Madrid', code: 'MAD-01', location: 'Calle Logística 5, 28001 Madrid' },
    { name: 'Almacén Puerto Barcelona', code: 'BCN-01', location: 'Zona Franca, 08040 Barcelona' },
  ];

  const warehouseMap = new Map()
  for (const w of warehouses) {
    const warehouse = await prisma.warehouse.create({ data: w })
    warehouseMap.set(w.code, warehouse.id)
  }

  // ─── Inventory ───
  const inventories = [
    { productId: productMap.get('3145891073607'), warehouseId: warehouseMap.get('MAD-01'), quantity: 150, batchCode: 'CHANEL-BLEU-2025A', costPrice: 78.50, expiryDate: new Date('2028-06-01'), warehouseLocation: 'A1-B3' },
    { productId: productMap.get('3348901250141'), warehouseId: warehouseMap.get('MAD-01'), quantity: 45, batchCode: 'DIOR-SAUVAGE-2024B', costPrice: 62.00, expiryDate: new Date('2027-12-01'), warehouseLocation: 'A2-C1' },
    { productId: productMap.get('3508441001114'), warehouseId: warehouseMap.get('MAD-01'), quantity: 12, batchCode: 'CREED-AVENTUS-2024A', costPrice: 245.00, expiryDate: new Date('2028-03-01'), warehouseLocation: 'B1-A2' },
    { productId: productMap.get('888066000512'), warehouseId: warehouseMap.get('BCN-01'), quantity: 25, batchCode: 'TF-OMBRE-2025C', costPrice: 110.00, expiryDate: new Date('2027-09-01'), warehouseLocation: 'C2-B1' },
    { productId: productMap.get('3605532612836'), warehouseId: warehouseMap.get('BCN-01'), quantity: 80, batchCode: 'LANCOME-LVEB-2025A', costPrice: 72.00, expiryDate: new Date('2028-01-01'), warehouseLocation: 'C1-A3' },
    { productId: productMap.get('5013515100160'), warehouseId: warehouseMap.get('MAD-01'), quantity: 60, batchCode: 'JM-WOODSAGE-2024A', costPrice: 88.00, expiryDate: new Date('2027-07-01'), warehouseLocation: 'A3-B2' },
    { productId: productMap.get('3348901400126'), warehouseId: warehouseMap.get('MAD-01'), quantity: 8, batchCode: 'PRADA-CARBON-2023B', costPrice: 95.00, expiryDate: new Date('2026-11-01'), warehouseLocation: 'A1-C4' },
  ];

  for (const inv of inventories) {
    await prisma.inventory.create({ data: inv })
  }

  // ─── Trading Operations ───
  const trades = [
    { type: 'Offer', partnerId: partnerMap.get('GlobalFragance GmbH'), productId: productMap.get('3145891073607'), quantity: 50, priceUnit: 78.50, incoterm: 'EXW', marketPrice: 135.00, status: 'Active', validUntil: new Date('2026-07-15') },
    { type: 'Offer', partnerId: partnerMap.get('Parfums World SA'), productId: productMap.get('3348901250141'), quantity: 120, priceUnit: 62.00, incoterm: 'FOB', marketPrice: 82.00, status: 'Active', validUntil: new Date('2026-07-20') },
    { type: 'Offer', partnerId: partnerMap.get('Luxury Scents Ltd'), productId: productMap.get('3508441001114'), quantity: 10, priceUnit: 245.00, incoterm: 'CIF', marketPrice: 320.00, status: 'Draft', validUntil: new Date('2026-08-01') },
    { type: 'Bid', partnerId: partnerMap.get('Aroma Select SL'), productId: productMap.get('888066000512'), quantity: 25, priceUnit: 110.00, incoterm: 'DDP', marketPrice: 235.00, status: 'Active', validUntil: new Date('2026-07-10') },
    { type: 'Bid', partnerId: partnerMap.get('Beauty Distribution Inc'), productId: productMap.get('3605532612836'), quantity: 80, priceUnit: 72.00, incoterm: 'FOB', marketPrice: 95.00, status: 'Accepted', validUntil: new Date('2026-06-30') },
    { type: 'Offer', partnerId: partnerMap.get('GlobalFragance GmbH'), productId: productMap.get('3348901400126'), quantity: 40, priceUnit: 95.00, incoterm: 'EXW', marketPrice: 110.00, status: 'Expired', validUntil: new Date('2026-06-01') },
    { type: 'Bid', partnerId: partnerMap.get('Parfums World SA'), productId: productMap.get('5013515100160'), quantity: 60, priceUnit: 88.00, incoterm: 'CIF', marketPrice: 105.00, status: 'Negotiating', validUntil: new Date('2026-07-25') },
    { type: 'Offer', partnerId: partnerMap.get('Luxury Scents Ltd'), productId: productMap.get('3614273456789'), quantity: 35, priceUnit: 105.00, incoterm: 'FOB', marketPrice: 130.00, status: 'Draft', validUntil: new Date('2026-08-05') },
  ];

  for (const tr of trades) {
    await prisma.tradingItem.create({ data: tr })
  }

  // ─── Invoices ───
  const invoices = [
    { partnerId: partnerMap.get('GlobalFragance GmbH'), invoiceNumber: 'INV-2026-0001', type: 'Offer', incoterm: 'EXW', totalNet: 3925.00, taxPercent: 21, totalGross: 4749.25, status: 'Paid', dueDate: new Date('2026-07-15') },
    { partnerId: partnerMap.get('Parfums World SA'), invoiceNumber: 'INV-2026-0002', type: 'Offer', incoterm: 'FOB', totalNet: 7440.00, taxPercent: 21, totalGross: 9002.40, status: 'Pending', dueDate: new Date('2026-08-01') },
    { partnerId: partnerMap.get('Aroma Select SL'), invoiceNumber: 'INV-2026-0003', type: 'Bid', incoterm: 'DDP', totalNet: 2750.00, taxPercent: 21, totalGross: 3327.50, status: 'Approved', dueDate: new Date('2026-07-30') },
    { partnerId: partnerMap.get('Beauty Distribution Inc'), invoiceNumber: 'INV-2026-0004', type: 'Bid', incoterm: 'FOB', totalNet: 5760.00, taxPercent: 21, totalGross: 6969.60, status: 'Shipped', dueDate: new Date('2026-07-10') },
    { partnerId: partnerMap.get('Luxury Scents Ltd'), invoiceNumber: 'INV-2026-0005', type: 'Offer', incoterm: 'EXW', totalNet: 2450.00, taxPercent: 21, totalGross: 2964.50, status: 'Cancelled', dueDate: new Date('2026-06-30') },
  ];

  for (const inv of invoices) {
    await prisma.invoice.create({ data: inv })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
