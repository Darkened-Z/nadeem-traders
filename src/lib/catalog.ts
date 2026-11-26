export const CATALOG_CATEGORIES = [
  { id: 1, name: "Dry Fruits", name_ur: "خشک میوہ", icon: "", image_url: "/categories/dry-fruits.jpg" },
  { id: 2, name: "Seeds", name_ur: "بیج", icon: "", image_url: "/categories/seeds.jpg" },
  { id: 3, name: "Spices", name_ur: "مصالحے", icon: "", image_url: "/categories/spices.jpg" },
  { id: 4, name: "Whole Spices", name_ur: "ثابت مصالحے", icon: "", image_url: "/categories/whole-spices.jpg" },
  { id: 5, name: "Special Items", name_ur: "خاص اشیاء", icon: "", image_url: "/categories/special-items.jpg" },
];

type Seed = [
  name: string,
  nameUr: string,
  origin: string | null,
  categoryId: number,
  image: string,
  price?: number,
  weight?: string,
];

const ITEMS: (Seed | null)[] = [
  ["Almonds", "بادام", "USA", 1, "almonds", 1800, "500g"],
  ["Cashews", "کاجو", "Vietnam", 1, "cashews", 950, "250g"],
  ["Pistachios", "پستہ", "Iran", 1, "pista", 1450, "250g"],
  ["Walnuts", "اخروٹ", "China", 1, "walnuts", 980, "250g"],
  null, // was a second "Cashews" (roasted); now the Roasted option of Cashews. Slot kept so ids match the database.
  ["Kishmish", "کشمش", "Afghanistan", 1, "kishmish", 380, "250g"],

  ["Sunflower Seeds", "سورج مکھی کے بیج", "USA", 2, "sunflower-seeds", 450, "250g"],
  ["Pumpkin Seeds", "کدو کے بیج", "Vietnam", 2, "pumpkin-seeds", 650, "250g"],
  ["Chia Seeds", "چیا سیڈز", "USA", 2, "chia-seeds", 480, "200g"],
  ["Sonf", "سونف", "India", 2, "sonf", 220, "200g"],
  ["Flax Seeds", "السی", "Ukraine", 2, "flax-seeds", 250, "200g"],
  ["Kalonji", "کلونجی", "Syria", 2, "kalonji", 280, "100g"],

  ["Red Chilli", "لال مرچ", "Sindh, Pakistan", 3, "red-chilli", 320, "200g"],
  ["Turmeric", "ہلدی", "Changa Manga, Pakistan", 3, "haldi-powder", 180, "200g"],
  ["Chilli Flakes", "دڑا مرچ", "Sindh, Pakistan", 3, "chilli-flakes", 290, "200g"],
  ["Round Red Chilli", "گول مرچ", "Sindh, Pakistan", 3, "gol-mirch", 340, "200g"],

  ["Black Pepper", "کالی مرچ", "Brazil", 4, "black-pepper", 480, "100g"],
  ["Garam Masala", "گرم مصالحہ", null, 4, "garam-masala", 380, "100g"],
  ["Cumin Seeds", "زیرہ", "India", 4, "zeera", 160, "100g"],
  ["Green Cardamom", "سبز الائچی", "Guatemala", 4, "green-cardamom", 890, "50g"],
  ["Black Cardamom", "کالی الائچی", "India", 4, "black-cardamom", 620, "100g"],
  ["Cloves", "لونگ", "Indonesia", 4, "cloves", 490, "50g"],

  ["Oats", "جئی", "Pakistan", 5, "oats", 380, "500g"],
  ["Ispaghol Chilka", "اسپغول چھلکا", "India", 5, "ispaghol", 450, "100g"],
];

export interface ProductOption {
  name: string;
  short_name: string | null;
  name_ur: string | null;
  price: number | null;
  weight: string | null;
  image_url: string | null;
}

// Initial product_variants rows (rate sheet of Nov 2026), keyed by product name. After seeding, prices are managed
// on the admin Daily Rates page.
export const OPTION_SEED: Record<string, ProductOption[]> = {
  Cashews: [
    { name: "Plain", short_name: null, name_ur: "سادہ کاجو", price: 1039, weight: "200g", image_url: "/products/cashews.jpg" },
    { name: "Roasted", short_name: null, name_ur: "بھنے ہوئے کاجو", price: 1099, weight: "200g", image_url: "/products/kaju-roasted.jpg" },
  ],
  Pistachios: [
    { name: "In-Shell", short_name: null, name_ur: "چھلکے والا پستہ", price: 1349, weight: "200g", image_url: "/products/pista.jpg" },
    { name: "Without Shell", short_name: null, name_ur: "پستہ مغز (بغیر چھلکا)", price: 2449, weight: "200g", image_url: "/products/pista-kernels.jpg" },
  ],
  Walnuts: [
    { name: "Cap", short_name: null, name_ur: "ثابت اخروٹ (چھلکے والا)", price: 399, weight: "250g", image_url: "/products/walnuts.jpg" },
    { name: "Without Cap", short_name: null, name_ur: "اخروٹ گری (بغیر ٹوپی)", price: 759, weight: "200g", image_url: "/products/walnut-kernels.jpg" },
  ],
  "Garam Masala": [
    { name: "Whole", short_name: null, name_ur: "ثابت گرم مصالحہ", price: 949, weight: "200g", image_url: "/products/garam-masala.jpg" },
    { name: "Powder", short_name: null, name_ur: "پسا ہوا گرم مصالحہ", price: 999, weight: "200g", image_url: "/products/garam-masala-powder.jpg" },
  ],
  "Black Pepper": [
    { name: "Whole", short_name: null, name_ur: "ثابت کالی مرچ", price: 789, weight: "200g", image_url: "/products/black-pepper.jpg" },
    { name: "Powder", short_name: null, name_ur: "پسی ہوئی کالی مرچ", price: 799, weight: "200g", image_url: "/products/black-pepper-powder.jpg" },
  ],
  "Red Chilli": [
    { name: "Powder", short_name: null, name_ur: "پسی ہوئی لال مرچ", price: 299, weight: "200g", image_url: "/products/red-chilli-powder.jpg" },
    { name: "Whole", short_name: null, name_ur: "ثابت لال مرچ", price: 299, weight: "200g", image_url: "/products/red-chilli.jpg" },
  ],
  Turmeric: [
    { name: "Powder", short_name: null, name_ur: "ہلدی پاؤڈر", price: 359, weight: "200g", image_url: "/products/haldi-powder.jpg" },
    { name: "Whole Root", short_name: null, name_ur: "ثابت گانٹھ", price: 359, weight: "200g", image_url: "/products/haldi-whole.jpg" },
  ],
  "Cumin Seeds": [
    { name: "White", short_name: null, name_ur: "سفید زیرہ", price: 499, weight: "200g", image_url: "/products/zeera.jpg" },
    { name: "Black", short_name: null, name_ur: "کالا زیرہ (شاہ زیرہ)", price: 499, weight: "200g", image_url: "/products/zeera-black.jpg" },
  ],
};

export function productOptions(product?: { variants?: ProductOption[] | null } | null): ProductOption[] {
  return product?.variants ?? [];
}

// Price, pack size and photo of a product as sold in the chosen option.
export function optionView(
  product: { price?: number | null; weight?: string | null; image_url?: string | null; variants?: ProductOption[] | null },
  variant?: string | null,
) {
  const option = productOptions(product).find((o) => o.name === variant);
  return {
    price: option ? option.price : (product.price ?? null),
    weight: option?.weight ?? product.weight ?? null,
    image_url: option?.image_url ?? product.image_url ?? null,
  };
}

export function cleanProductTitle(name?: string | null): string {
  if (!name) return "";
  let n = name.trim();
  if (/without cap/i.test(n) || /uncapped/i.test(n)) return "Walnuts";
  if (/^walnut/i.test(n) || /akhrot/i.test(n)) return "Walnuts";
  if (/^clove/i.test(n) || /laung/i.test(n)) return "Cloves";
  if (/^black pepper/i.test(n) || /kaali mirch/i.test(n) || /kali mirch/i.test(n)) return "Black Pepper";
  if (/^pistachio/i.test(n) || /pista/i.test(n)) return "Pistachios";
  if (/^cashew/i.test(n) || /kaju/i.test(n)) {
    if (/roasted/i.test(n)) return "Roasted Cashews";
    if (/nut/i.test(n)) return "Cashew Nuts";
    return "Cashews";
  }
  if (/^chilli flakes/i.test(n) || /dara mirch/i.test(n)) return "Chilli Flakes";
  if (/^gol mirch/i.test(n) || /^round red chilli/i.test(n) || /round chilli/i.test(n)) return "Round Red Chilli";
  if (/^red chilli/i.test(n) || /^laal mirch/i.test(n)) return "Red Chilli";
  if (/^zeera/i.test(n) || /^cumin/i.test(n)) return "Cumin Seeds";
  if (/^garam masala/i.test(n)) return "Garam Masala";
  if (/^turmeric/i.test(n) || /^haldi/i.test(n)) return "Turmeric";
  // Strip any bracketed Roman Urdu like (Akhrot), (Kaali Mirch), etc.
  return n.replace(/\s*\([^)]*\)/g, "").trim();
}

export const CATALOG_PRODUCTS = ITEMS.flatMap((row, i) => {
  if (!row) return [];
  const [name, name_ur, origin, category_id, image, price, weight] = row;
  return [{
  id: i + 1,
  name,
  name_ur,
  origin,
  brand: "Nadeem Traders",
  weight: weight ?? null,
  price: price ?? null,
  emoji: "",
  stock: true,
  category_id,
  category_name: CATALOG_CATEGORIES.find((c) => c.id === category_id)!.name,
  image_url: `/products/${image}.jpg`,
  variants: OPTION_SEED[name] ?? [],
  }];
});
