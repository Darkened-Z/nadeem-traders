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
  ["Pistachios (Pista)", "پستہ", "Iran", 1, "pista"],
  ["Walnuts (Akhrot)", "اخروٹ", "China", 1, "walnuts"],
  ["Cashews (Kaju)", "کاجو", "Vietnam", 1, "kaju-roasted"],
  ["Kishmish", "کشمش", "Afghanistan", 1, "kishmish"],

  ["Sunflower Seeds", "سورج مکھی کے بیج", "USA", 2, "sunflower-seeds"],
  ["Pumpkin Seeds", "کدو کے بیج", "Vietnam", 2, "pumpkin-seeds", 650, "250g"],
  ["Chia Seeds", "چیا سیڈز", "USA", 2, "chia-seeds"],
  ["Sonf", "سونف", "India", 2, "sonf"],
  ["Flax Seeds", "السی", "Ukraine", 2, "flax-seeds"],
  ["Kalonji", "کلونجی", "Syria", 2, "kalonji"],

  ["Red Chilli", "لال مرچ", "Sindh, Pakistan", 3, "red-chilli", 320, "200g"],
  ["Turmeric", "ہلدی", "Changa Manga, Pakistan", 3, "haldi-powder", 180, "200g"],
  ["Chilli Flakes (Dara Mirch)", "دڑا مرچ", "Sindh, Pakistan", 3, "chilli-flakes"],
  ["Gol Mirch (Round Red Chilli)", "گول مرچ", "Sindh, Pakistan", 3, "gol-mirch"],

  ["Black Pepper (Kaali Mirch)", "کالی مرچ", "Brazil", 4, "black-pepper"],
  ["Garam Masala", "گرم مصالحہ", null, 4, "garam-masala"],
  ["Zeera (Cumin)", "زیرہ", "India", 4, "zeera", 160, "100g"],
  ["Green Cardamom", "سبز الائچی", "Guatemala", 4, "green-cardamom"],
  ["Black Cardamom", "کالی الائچی", "India", 4, "black-cardamom"],
  ["Cloves", "لونگ", "Indonesia", 4, "cloves"],

  ["Oats", "جئی (اوٹس)", "Pakistan", 5, "oats"],
  ["Ispaghol Chilka", "اسپغول چھلکا", "India", 5, "ispaghol"],
];

export interface ProductClassification {
  id: string;
  name: string;
  name_ur: string;
}

export const PRODUCT_CLASSIFICATIONS: Record<string, ProductClassification[]> = {
  // Walnuts (Akhrot)
  walnuts: [
    { id: "kernels", name: "Kernels / Shelled (Giri)", name_ur: "اخروٹ گری" },
    { id: "inshell", name: "In-Shell (Kaghzi)", name_ur: "کاغذی اخروٹ (چھلکے والا)" },
  ],
  // Black Pepper (Kaali Mirch)
  "black-pepper": [
    { id: "whole", name: "Whole / Sabut", name_ur: "ثابت کالی مرچ" },
    { id: "powder", name: "Powder / Ground", name_ur: "پسی ہوئی کالی مرچ" },
  ],
  // Garam Masala
  "garam-masala": [
    { id: "whole", name: "Whole / Sabut", name_ur: "ثابت گرم مصالحہ" },
    { id: "powder", name: "Powder / Ground", name_ur: "پسا ہوا گرم مصالحہ" },
  ],
  // Red Chilli (Laal Mirch)
  "red-chilli": [
    { id: "powder", name: "Powder / Pisi Hui", name_ur: "پسی ہوئی لال مرچ" },
    { id: "whole", name: "Whole / Sabut (Dandi Cut)", name_ur: "ثابت لال مرچ" },
  ],
  // Turmeric (Haldi)
  turmeric: [
    { id: "powder", name: "Powder", name_ur: "ہلدی پاؤڈر" },
    { id: "whole", name: "Whole / Sabut Ganth", name_ur: "ثابت گانٹھ" },
  ],
  // Pistachios (Pista)
  pista: [
    { id: "inshell", name: "In-Shell (Chilke Wala)", name_ur: "چھلکے والا پستہ" },
    { id: "kernels", name: "Kernels / Maghaz (Giri)", name_ur: "پستہ مغز (گری)" },
  ],
  // Cashews (Kaju)
  cashews: [
    { id: "plain", name: "Plain / Raw", name_ur: "سادہ کاجو" },
    { id: "roasted", name: "Roasted / Salted", name_ur: "بھنے ہوئے کاجو" },
  ],
  // Zeera (Cumin)
  zeera: [
    { id: "safaid", name: "Safaid Zeera (White)", name_ur: "سفید زیرہ" },
    { id: "kala", name: "Kala Zeera (Black)", name_ur: "کالا زیرہ" },
  ],
};

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
