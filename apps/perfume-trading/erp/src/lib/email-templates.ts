/**
 * Email Templates — Plantillas profesionales multilingüe para Trading de Perfumería.
 *
 * Idiomas: ES, EN, FR
 * Tipos: Offer, Bid, Invoice, Shipping, Payment
 */

export type TemplateLang = 'ES' | 'EN' | 'FR';
export type TemplateType = 'offer' | 'bid' | 'invoice' | 'shipping' | 'payment' | 'welcome';

export interface EmailTemplate {
  subject: string;
  body: string;
  type: TemplateType;
  lang: TemplateLang;
}

interface TemplateVars {
  partnerName: string;
  productName: string;
  brandName: string;
  quantity: number;
  priceUnit: string;
  totalAmount: string;
  incoterm: string;
  invoiceNumber?: string;
  validUntil?: string;
  companyName?: string;
}

function fill(template: string, vars: TemplateVars): string {
  return template
    .replace(/{partnerName}/g, vars.partnerName)
    .replace(/{productName}/g, vars.productName)
    .replace(/{brandName}/g, vars.brandName)
    .replace(/{quantity}/g, String(vars.quantity))
    .replace(/{priceUnit}/g, vars.priceUnit)
    .replace(/{totalAmount}/g, vars.totalAmount)
    .replace(/{incoterm}/g, vars.incoterm)
    .replace(/{invoiceNumber}/g, vars.invoiceNumber ?? 'N/A')
    .replace(/{validUntil}/g, vars.validUntil ?? 'N/A')
    .replace(/{companyName}/g, vars.companyName ?? 'Perfume Trading SL');
}

// ─── Templates ───

const TEMPLATES: Record<TemplateLang, Record<TemplateType, [string, string]>> = {
  ES: {
    offer: [
      '📦 Oferta: {brandName} {productName} — {totalAmount}',
      `Estimado/a {partnerName},

Nos complace presentarle nuestra oferta para el siguiente producto:

━━━━━━━━━━━━━━━━━━━━━━━━━
  MARCA:     {brandName}
  PRODUCTO:  {productName}
  CANTIDAD:  {quantity} uds.
  PRECIO:    {priceUnit}/ud
  TOTAL:     {totalAmount}
  INCOTERM:  {incoterm}
  VÁLIDO:    {validUntil}
━━━━━━━━━━━━━━━━━━━━━━━━━

Quedamos a su disposición para cualquier consulta o negociación adicional.

Atentamente,
{companyName}
Tel: +34 91 123 45 67
Email: trading@teringo.app`,
    ],
    bid: [
      '📥 Solicitud de Compra: {brandName} {productName}',
      `Estimado/a {partnerName},

Mediante la presente, confirmamos nuestro interés en adquirir el siguiente producto:

━━━━━━━━━━━━━━━━━━━━━━━━━
  MARCA:     {brandName}
  PRODUCTO:  {productName}
  CANTIDAD:  {quantity} uds.
  PRECIO:    {priceUnit}/ud
  TOTAL:     {totalAmount}
  INCOTERM:  {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

Quedamos a la espera de su confirmación.

Saludos cordiales,
{companyName}`,
    ],
    invoice: [
      '🧾 Factura {invoiceNumber} — {partnerName}',
      `Estimado/a {partnerName},

Adjuntamos la factura proforma correspondiente:

━━━━━━━━━━━━━━━━━━━━━━━━━
  N° FACTURA: {invoiceNumber}
  PRODUCTO:   {brandName} {productName}
  CANTIDAD:   {quantity} uds.
  TOTAL:      {totalAmount}
  INCOTERM:   {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

Fecha de vencimiento: {validUntil}

Quedamos a su disposición.

Atentamente,
{companyName}`,
    ],
    shipping: [
      '🚚 Envío Confirmado — {invoiceNumber}',
      `Estimado/a {partnerName},

Le informamos que su pedido ha sido enviado:

━━━━━━━━━━━━━━━━━━━━━━━━━
  FACTURA:    {invoiceNumber}
  PRODUCTO:   {brandName} {productName}
  CANTIDAD:   {quantity} uds.
  INCOTERM:   {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

Puede realizar el tracking del envío a través de nuestro portal.

Atentamente,
{companyName}`,
    ],
    payment: [
      '💰 Pago Confirmado — {invoiceNumber}',
      `Estimado/a {partnerName},

Confirmamos la recepción del pago correspondiente a la factura:

━━━━━━━━━━━━━━━━━━━━━━━━━
  N° FACTURA: {invoiceNumber}
  PRODUCTO:   {brandName} {productName}
  TOTAL:      {totalAmount}
━━━━━━━━━━━━━━━━━━━━━━━━━

Muchas gracias por su confianza.

Saludos,
{companyName}`,
    ],
    welcome: [
      '🤝 Bienvenido a Teringo — {partnerName}',
      `Estimado/a {partnerName},

Nos complace darle la bienvenida a nuestra plataforma de trading.

A partir de ahora podrá:

✅ Recibir ofertas y enviar bids en tiempo real
✅ Consultar nuestro catálogo completo de fragancias
✅ Gestionar facturación y envíos internacionales
✅ Acceder a precios de mercado actualizados

Para cualquier consulta, no dude en contactarnos.

Bienvenido a bordo.

Atentamente,
El equipo de {companyName}
trading@teringo.app`,
    ],
  },

  EN: {
    offer: [
      '📦 Offer: {brandName} {productName} — {totalAmount}',
      `Dear {partnerName},

We are pleased to present our offer for the following product:

━━━━━━━━━━━━━━━━━━━━━━━━━
  BRAND:     {brandName}
  PRODUCT:   {productName}
  QUANTITY:  {quantity} units
  PRICE:     {priceUnit}/unit
  TOTAL:     {totalAmount}
  INCOTERM:  {incoterm}
  VALID:     {validUntil}
━━━━━━━━━━━━━━━━━━━━━━━━━

We remain at your disposal for any further inquiries.

Best regards,
{companyName}
Tel: +34 91 123 45 67
Email: trading@teringo.app`,
    ],
    bid: [
      '📥 Purchase Request: {brandName} {productName}',
      `Dear {partnerName},

We hereby confirm our interest in purchasing the following product:

━━━━━━━━━━━━━━━━━━━━━━━━━
  BRAND:      {brandName}
  PRODUCT:    {productName}
  QUANTITY:   {quantity} units
  PRICE:      {priceUnit}/unit
  TOTAL:      {totalAmount}
  INCOTERM:   {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to your confirmation.

Best regards,
{companyName}`,
    ],
    invoice: [
      '🧾 Invoice {invoiceNumber} — {partnerName}',
      `Dear {partnerName},

Please find attached the proforma invoice:

━━━━━━━━━━━━━━━━━━━━━━━━━
  INVOICE:    {invoiceNumber}
  PRODUCT:    {brandName} {productName}
  QUANTITY:   {quantity} units
  TOTAL:      {totalAmount}
  INCOTERM:   {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

Due date: {validUntil}

Best regards,
{companyName}`,
    ],
    shipping: [
      '🚚 Shipment Confirmed — {invoiceNumber}',
      `Dear {partnerName},

We are pleased to inform you that your order has been shipped:

━━━━━━━━━━━━━━━━━━━━━━━━━
  INVOICE:    {invoiceNumber}
  PRODUCT:    {brandName} {productName}
  QUANTITY:   {quantity} units
  INCOTERM:   {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

You may track your shipment through our portal.

Best regards,
{companyName}`,
    ],
    payment: [
      '💰 Payment Confirmed — {invoiceNumber}',
      `Dear {partnerName},

We confirm receipt of payment for invoice:

━━━━━━━━━━━━━━━━━━━━━━━━━
  INVOICE:    {invoiceNumber}
  PRODUCT:    {brandName} {productName}
  TOTAL:      {totalAmount}
━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your trust.

Best regards,
{companyName}`,
    ],
    welcome: [
      '🤝 Welcome to Teringo — {partnerName}',
      `Dear {partnerName},

Welcome to our trading platform.

You can now:

✅ Receive offers and send bids in real-time
✅ Browse our complete fragrance catalog
✅ Manage invoicing and international shipping
✅ Access updated market prices

For any questions, please do not hesitate to contact us.

Welcome aboard.

Best regards,
The {companyName} Team
trading@teringo.app`,
    ],
  },

  FR: {
    offer: [
      '📦 Offre : {brandName} {productName} — {totalAmount}',
      `Cher/Chère {partnerName},

Nous avons le plaisir de vous présenter notre offre pour le produit suivant :

━━━━━━━━━━━━━━━━━━━━━━━━━
  MARQUE :    {brandName}
  PRODUIT :   {productName}
  QUANTITÉ :  {quantity} unités
  PRIX :      {priceUnit}/unité
  TOTAL :     {totalAmount}
  INCOTERM :  {incoterm}
  VALABLE :   {validUntil}
━━━━━━━━━━━━━━━━━━━━━━━━━

Nous restons à votre disposition pour toute question.

Cordialement,
{companyName}
Tél : +34 91 123 45 67
Email : trading@teringo.app`,
    ],
    bid: [
      '📥 Demande d\'Achat : {brandName} {productName}',
      `Cher/Chère {partnerName},

Nous confirmons notre intérêt pour l'achat du produit suivant :

━━━━━━━━━━━━━━━━━━━━━━━━━
  MARQUE :    {brandName}
  PRODUIT :   {productName}
  QUANTITÉ :  {quantity} unités
  PRIX :      {priceUnit}/unité
  TOTAL :     {totalAmount}
  INCOTERM :  {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

Dans l'attente de votre confirmation.

Cordialement,
{companyName}`,
    ],
    invoice: [
      '🧾 Facture {invoiceNumber} — {partnerName}',
      `Cher/Chère {partnerName},

Veuillez trouver ci-joint la facture proforma :

━━━━━━━━━━━━━━━━━━━━━━━━━
  FACTURE :   {invoiceNumber}
  PRODUIT :   {brandName} {productName}
  QUANTITÉ :  {quantity} unités
  TOTAL :     {totalAmount}
  INCOTERM :  {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

Date d'échéance : {validUntil}

Cordialement,
{companyName}`,
    ],
    shipping: [
      '🚚 Expédition Confirmée — {invoiceNumber}',
      `Cher/Chère {partnerName},

Nous avons le plaisir de vous informer que votre commande a été expédiée :

━━━━━━━━━━━━━━━━━━━━━━━━━
  FACTURE :    {invoiceNumber}
  PRODUIT :    {brandName} {productName}
  QUANTITÉ :   {quantity} unités
  INCOTERM :   {incoterm}
━━━━━━━━━━━━━━━━━━━━━━━━━

Vous pouvez suivre votre envoi via notre portail.

Cordialement,
{companyName}`,
    ],
    payment: [
      '💰 Paiement Confirmé — {invoiceNumber}',
      `Cher/Chère {partnerName},

Nous confirmons la réception du paiement pour la facture :

━━━━━━━━━━━━━━━━━━━━━━━━━
  FACTURE :    {invoiceNumber}
  PRODUIT :    {brandName} {productName}
  TOTAL :      {totalAmount}
━━━━━━━━━━━━━━━━━━━━━━━━━

Merci pour votre confiance.

Cordialement,
{companyName}`,
    ],
    welcome: [
      '🤝 Bienvenue chez Teringo — {partnerName}',
      `Cher/Chère {partnerName},

Nous sommes ravis de vous accueillir sur notre plateforme de trading.

Vous pouvez désormais :

✅ Recevoir des offres et envoyer des enchères en temps réel
✅ Consulter notre catalogue complet de fragrances
✅ Gérer la facturation et les expéditions internationales
✅ Accéder aux prix du marché mis à jour

Pour toute question, n'hésitez pas à nous contacter.

Bienvenue à bord.

Cordialement,
L'équipe {companyName}
trading@teringo.app`,
    ],
  },
};

export function getTemplates(): Record<TemplateLang, Record<TemplateType, [string, string]>> {
  return TEMPLATES;
}

export function generateEmail(
  type: TemplateType,
  lang: TemplateLang,
  vars: TemplateVars
): EmailTemplate {
  const tpl = TEMPLATES[lang]?.[type];
  if (!tpl) throw new Error(`Template not found: ${type}/${lang}`);
  return {
    subject: fill(tpl[0], vars),
    body: fill(tpl[1], vars),
    type,
    lang,
  };
}

export const TEMPLATE_TYPES: { key: TemplateType; label: Record<TemplateLang, string> }[] = [
  { key: 'offer', label: { ES: 'Oferta', EN: 'Offer', FR: 'Offre' } },
  { key: 'bid', label: { ES: 'Solicitud de Compra', EN: 'Purchase Request', FR: "Demande d'Achat" } },
  { key: 'invoice', label: { ES: 'Factura', EN: 'Invoice', FR: 'Facture' } },
  { key: 'shipping', label: { ES: 'Envío', EN: 'Shipping', FR: 'Expédition' } },
  { key: 'payment', label: { ES: 'Pago', EN: 'Payment', FR: 'Paiement' } },
  { key: 'welcome', label: { ES: 'Bienvenida', EN: 'Welcome', FR: 'Bienvenue' } },
];

export const LANGUAGES: { key: TemplateLang; flag: string; label: string }[] = [
  { key: 'ES', flag: '🇪🇸', label: 'Español' },
  { key: 'EN', flag: '🇬🇧', label: 'English' },
  { key: 'FR', flag: '🇫🇷', label: 'Français' },
];
