// src/components/InvoiceDocument.tsx
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

import CairoFont from '../assets/fonts/Cairo.ttf';


Font.register({
  family: 'Cairo',
  src: CairoFont,
});

const gold = '#C9A84C';
const darkBg = '#1a1208';
const lightGold = '#F5E6C0';
const white = '#FFFFFF';
const gray = '#888';

const styles = StyleSheet.create({
  page: {
    backgroundColor: darkBg,
    fontFamily: 'Cairo',
    padding: 0,
  },
  // ─── Header ───────────────────────────────────────────────
  header: {
    backgroundColor: '#0d0a04',
    paddingVertical: 28,
    paddingHorizontal: 40,
    borderBottomWidth: 1,
    borderBottomColor: gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: darkBg,
    fontSize: 10,
    fontFamily: 'Cairo',
    fontWeight: 'bold',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  brandName: {
    color: gold,
    fontSize: 26,
    fontFamily: 'Cairo',
    letterSpacing: 4,
  },
  brandSub: {
    color: lightGold,
    fontSize: 9,
    letterSpacing: 6,
    marginTop: 2,
  },
  invoiceLabel: {
    color: gray,
    fontSize: 8,
    letterSpacing: 3,
    marginTop: 6,
  },
  invoiceNumber: {
    color: gold,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
  },
  // ─── Gold divider ──────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: gold,
    marginHorizontal: 40,
    marginVertical: 0,
    opacity: 0.4,
  },
  // ─── Body ─────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: gold,
    fontSize: 9,
    letterSpacing: 4,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  // ─── Items table ──────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: gold,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderText: {
    color: gold,
    fontSize: 8,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  tableHeaderTextLeft: {
    color: gold,
    fontSize: 8,
    letterSpacing: 2,
    flex: 3,
  },
  // ─── Item row ─────────────────────────────────────────────
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a200a',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: gold,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#2a200a',
    borderWidth: 1,
    borderColor: gold,
  },
  itemInfo: {
    flex: 3,
  },
  itemName: {
    color: white,
    fontSize: 11,
    fontFamily: 'Cairo',
  },
  itemDesc: {
    color: gray,
    fontSize: 8,
    marginTop: 2,
  },
  itemQty: {
    flex: 1,
    color: lightGold,
    fontSize: 10,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1,
    color: lightGold,
    fontSize: 10,
    textAlign: 'center',
  },
  itemTotal: {
    flex: 1,
    color: gold,
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  // ─── Total box ────────────────────────────────────────────
  totalBox: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 220,
    borderWidth: 1,
    borderColor: gold,
    borderRadius: 6,
    padding: 14,
    backgroundColor: '#0d0a04',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    color: gray,
    fontSize: 9,
  },
  totalValue: {
    color: lightGold,
    fontSize: 9,
  },
  grandTotalLabel: {
    color: gold,
    fontSize: 12,
    fontFamily: 'Cairo',
  },
  grandTotalValue: {
    color: gold,
    fontSize: 12,
    fontFamily: 'Cairo',
  },
  totalDivider: {
    height: 1,
    backgroundColor: gold,
    opacity: 0.3,
    marginVertical: 6,
  },
  // ─── Footer ───────────────────────────────────────────────
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#2a200a',
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    color: gray,
    fontSize: 8,
    letterSpacing: 2,
    textAlign: 'center',
  },
  footerBrand: {
    color: gold,
    fontSize: 9,
    letterSpacing: 3,
    marginTop: 4,
  },
  // ─── Decorative corner ────────────────────────────────────
  cornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: gold,
    opacity: 0.5,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: gold,
    opacity: 0.5,
  },
});

interface InvoiceItem {
  id: number | string;
  name: string;
  name_ar?: string;
  name_en?: string;
  arabic_name?: string;
  english_name?: string;
  price: number;
  quantity?: number;
  image?: string;
  image_file?: string;
  image_url?: string;
}

interface InvoiceDocumentProps {
  items: InvoiceItem[];
  language?: string;
  invoiceNumber?: string;
  date?: string;
}

const getProductName = (item: InvoiceItem, language: string) =>
  language === 'ar'
    ? item.arabic_name || item.name_ar || item.name || 'منتج'
    : item.english_name || item.name_en || item.name || 'Product';

const getImageUrl = (item: InvoiceItem): string | null => {
  const url = item.image_file || item.image_url || item.image || null;
  if (!url) return null;
  // تجاهل صور خارجية ممكن تعمل CORS
  if (url.includes('istockphoto')) return null;
  if (url.includes('placeholder')) return null;
  return url;
};

const InvoiceDocument = ({
  items,
  language = 'ar',
  invoiceNumber,
  date,
}: InvoiceDocumentProps) => {
  const validItems = items.filter(i => !(i as any).isDeleted);
  const subtotal = validItems.reduce(
    (acc, i) => acc + i.price * (i.quantity || 1),
    0
  );
  const invoiceNum =
    invoiceNumber || `SS-${Date.now().toString().slice(-6)}`;
  const invoiceDate =
    date || new Date().toLocaleDateString('en-GB');

  const isAr = language === 'ar';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Decorative corners */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerBR} />

        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Logo circle */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>SS</Text>
          </View>

          {/* Brand info */}
          <View style={styles.headerRight}>
            <Text style={styles.brandName}>SAUDI SILVER</Text>
            <Text style={styles.brandSub}>LUXURY JEWELRY</Text>
            <Text style={styles.invoiceLabel}>
              {isAr ? 'رقم الفاتورة' : 'INVOICE NO.'}
            </Text>
            <Text style={styles.invoiceNumber}>{invoiceNum}</Text>
          </View>
        </View>

        {/* ── Date strip ── */}
        <View
          style={{
            backgroundColor: '#110e04',
            paddingHorizontal: 40,
            paddingVertical: 8,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}
        >
          <Text style={{ color: gray, fontSize: 8, letterSpacing: 2 }}>
            {isAr ? 'التاريخ: ' : 'DATE: '}
            <Text style={{ color: lightGold }}>{invoiceDate}</Text>
          </Text>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>
            {isAr ? 'تفاصيل الطلب' : 'Order Details'}
          </Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderTextLeft, { flex: 4 }]}>
              {isAr ? 'المنتج' : 'PRODUCT'}
            </Text>
            <Text style={styles.tableHeaderText}>
              {isAr ? 'الكمية' : 'QTY'}
            </Text>
            <Text style={styles.tableHeaderText}>
              {isAr ? 'السعر' : 'PRICE'}
            </Text>
            <Text style={styles.tableHeaderText}>
              {isAr ? 'الإجمالي' : 'TOTAL'}
            </Text>
          </View>

          {/* Items */}
          {validItems.map(item => {
            const imageUrl = getImageUrl(item);
            const qty = item.quantity || 1;
            const lineTotal = item.price * qty;

            return (
              <View key={item.id} style={styles.itemRow}>
                {/* Image */}
                {imageUrl ? (
                  <Image src={imageUrl} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder} />
                )}

                {/* Name */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {getProductName(item, language)}
                  </Text>
                  <Text style={styles.itemDesc}>
                    {isAr ? 'فضة سعودية أصيلة' : 'Authentic Saudi Silver'}
                  </Text>
                </View>

                <Text style={styles.itemQty}>{qty}</Text>
                <Text style={styles.itemPrice}>
                  ${item.price.toLocaleString()}
                </Text>
                <Text style={styles.itemTotal}>
                  ${lineTotal.toLocaleString()}
                </Text>
              </View>
            );
          })}

          {/* Total box */}
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {isAr ? 'المجموع الفرعي' : 'Subtotal'}
              </Text>
              <Text style={styles.totalValue}>
                ${subtotal.toLocaleString()}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {isAr ? 'الشحن' : 'Shipping'}
              </Text>
              <Text style={styles.totalValue}>
                {isAr ? 'مجاني' : 'Free'}
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>
                {isAr ? 'الإجمالي' : 'Total'}
              </Text>
              <Text style={styles.grandTotalValue}>
                ${subtotal.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isAr
                ? 'شكراً لثقتك في Saudi Silver — جودة لا تُضاهى'
                : 'Thank you for choosing Saudi Silver — Unmatched Quality'}
            </Text>
            <Text style={styles.footerBrand}>✦ SAUDI SILVER ✦</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceDocument;