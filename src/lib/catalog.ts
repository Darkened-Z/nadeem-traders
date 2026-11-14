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

const ITEMS: Seed[] = [
  ["Almonds", "بادام", "USA", 1, "almonds", 1800, "500g"],
  ["Cashew Nuts", "کاجو", "Vietnam", 1, "cashews", 950, "250g"],
  ["Pistachios", "پستہ", "Iran", 1, "pista", 1450, "250g"],
  ["Walnuts", "اخروٹ", "China", 1, "walnuts", 980, "250g"],
  ["Cashews", "کاجو", "Vietnam", 1, "kaju-roasted", 950, "250g"],
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

export interface ProductClassification {
  id: string;
  name: string;
  name_ur: string;
}

export const PRODUCT_CLASSIFICATIONS: Record<string, ProductClassification[]> = {
  // Walnuts
  walnuts: [
    { id: "kernels", name: "Kernels / Shelled", name_ur: "اخروٹ گری" },
    { id: "inshell", name: "In-Shell / Whole", name_ur: "ثابت اخروٹ" },
  ],
  // Black Pepper
  "black-pepper": [
    { id: "whole", name: "Whole", name_ur: "ثابت کالی مرچ" },
    { id: "powder", name: "Ground Powder", name_ur: "پسی ہوئی کالی مرچ" },
  ],
  // Garam Masala
  "garam-masala": [
    { id: "whole", name: "Whole Masala", name_ur: "ثابت گرم مصالحہ" },
    { id: "powder", name: "Ground Powder", name_ur: "پسا ہوا گرم مصالحہ" },
  ],
  // Red Chilli
  "red-chilli": [
    { id: "powder", name: "Powder", name_ur: "پسی ہوئی لال مرچ" },
    { id: "whole", name: "Whole (Stem Cut)", name_ur: "ثابت لال مرچ" },
  ],
  // Turmeric
  turmeric: [
    { id: "powder", name: "Powder", name_ur: "ہلدی پاؤڈر" },
    { id: "whole", name: "Whole Root", name_ur: "ثابت گانٹھ" },
  ],
  // Pistachios
  pista: [
    { id: "inshell", name: "In-Shell", name_ur: "چھلکے والا پستہ" },
    { id: "kernels", name: "Kernels / Shelled", name_ur: "پستہ مغز" },
  ],
  // Cashews
  cashews: [
    { id: "plain", name: "Plain / Raw", name_ur: "سادہ کاجو" },
    { id: "roasted", name: "Roasted & Salted", name_ur: "بھنے ہوئے کاجو" },
  ],
  // Zeera (Cumin)
  zeera: [
    { id: "safaid", name: "White Cumin", name_ur: "سفید زیرہ" },
    { id: "kala", name: "Black Cumin", name_ur: "کالا زیرہ" },
  ],
};

export function cleanProductTitle(name?: string | null): string {
  if (!name) return "";
  let n = name.trim();
  if (/without cap/i.test(n)) return "Walnuts";
  if (/^walnut/i.test(n) || /akhrot/i.test(n)) return "Walnuts";
  if (/^black pepper/i.test(n) || /kaali mirch/i.test(n) || /kali mirch/i.test(n)) return "Black Pepper";
  if (/^pistachio/i.test(n) || /pista/i.test(n)) return "Pistachios";
  if (/^cashew/i.test(n) || /kaju/i.test(n)) {
    if (/roasted/i.test(n)) return "Roasted Cashews";
    if (/nut/i.test(n)) return "Cashew Nuts";
    return "Cashews";
  }
  if (/^chilli flakes/i.test(n) || /dara mirch/i.test(n)) return "Chilli Flakes";
  if (/^gol mirch/i.test(n) || /^round red chilli/i.test(n)) return "Round Red Chilli";
  if (/^zeera/i.test(n) || /^cumin/i.test(n)) return "Cumin Seeds";
  if (/^garam masala/i.test(n)) return "Garam Masala";
  // Strip any bracketed Roman Urdu like (Akhrot), (Kaali Mirch), etc.
  return n.replace(/\s*\([^)]*\)/g, "").trim();
}

export function getProductClassifications(product?: { name?: string | null; id?: number | null }): ProductClassification[] {
  if (!product || !product.name) return [];
  const n = product.name.toLowerCase();
  if (n.includes("walnut") || n.includes("akhrot")) return PRODUCT_CLASSIFICATIONS.walnuts;
  if (n.includes("black pepper") || n.includes("kaali mirch") || n.includes("kali mirch")) return PRODUCT_CLASSIFICATIONS["black-pepper"];
  if (n.includes("garam masala")) return PRODUCT_CLASSIFICATIONS["garam-masala"];
  if (n.includes("red chilli") || n.includes("laal mirch")) return PRODUCT_CLASSIFICATIONS["red-chilli"];
  if (n.includes("turmeric") || n.includes("haldi")) return PRODUCT_CLASSIFICATIONS.turmeric;
  if (n.includes("pista") || n.includes("pistachio")) return PRODUCT_CLASSIFICATIONS.pista;
  if (n.includes("kaju") || n.includes("cashew")) return PRODUCT_CLASSIFICATIONS.cashews;
  if (n.includes("zeera") || n.includes("cumin")) return PRODUCT_CLASSIFICATIONS.zeera;
  return [];
}

export const CATALOG_PRODUCTS = ITEMS.map(([name, name_ur, origin, category_id, image, price, weight], i) => ({
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
}));
