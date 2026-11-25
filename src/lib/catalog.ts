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
  ["Cashew Nuts", "کاجو", "Vietnam", 1, "cashews", 950, "250g"],
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

export interface ProductClassification {
  id: string;
  name: string;
  name_ur: string;
  shortName?: string;
  image?: string;
}

export const PRODUCT_CLASSIFICATIONS: Record<string, ProductClassification[]> = {
  // Walnuts (Cap vs Without Cap)
  walnuts: [
    { id: "cap", name: "Cap", shortName: "Cap", name_ur: "ثابت اخروٹ (چھلکے والا)", image: "/products/walnuts.jpg" },
    { id: "without-cap", name: "Without Cap", shortName: "Without Cap", name_ur: "اخروٹ گری (بغیر ٹوپی)", image: "/products/walnut-kernels.jpg" },
  ],
  // Cloves (Capped vs Uncapped)
  cloves: [
    { id: "capped", name: "Capped / Topi", shortName: "Capped", name_ur: "ٹوپی والا لونگ", image: "/products/cloves-capped.jpg" },
    { id: "uncapped", name: "Uncapped / Headless", shortName: "Uncapped", name_ur: "بغیر ٹوپی لونگ", image: "/products/cloves-uncapped.jpg" },
  ],
  // Pistachios (In-Shell vs Without Shell)
  pista: [
    { id: "inshell", name: "In-Shell", shortName: "In-Shell", name_ur: "چھلکے والا پستہ", image: "/products/pista.jpg" },
    { id: "without-shell", name: "Without Shell", shortName: "Without Shell", name_ur: "پستہ مغز (بغیر چھلکا)", image: "/products/pista-kernels.jpg" },
  ],
  // Cashews (Plain vs Roasted)
  cashews: [
    { id: "plain", name: "Plain", shortName: "Plain", name_ur: "سادہ کاجو", image: "/products/cashews.jpg" },
    { id: "roasted", name: "Roasted", shortName: "Roasted", name_ur: "بھنے ہوئے کاجو", image: "/products/kaju-roasted.jpg" },
  ],
  // Garam Masala (Whole vs Powder)
  "garam-masala": [
    { id: "whole", name: "Whole", shortName: "Whole", name_ur: "ثابت گرم مصالحہ", image: "/products/garam-masala.jpg" },
    { id: "powder", name: "Powder", shortName: "Powder", name_ur: "پسا ہوا گرم مصالحہ", image: "/products/garam-masala-powder.jpg" },
  ],
  // Black Pepper (Whole vs Powder)
  "black-pepper": [
    { id: "whole", name: "Whole", shortName: "Whole", name_ur: "ثابت کالی مرچ", image: "/products/black-pepper.jpg" },
    { id: "powder", name: "Powder", shortName: "Powder", name_ur: "پسی ہوئی کالی مرچ", image: "/products/black-pepper-powder.jpg" },
  ],
  // Red Chilli (Powder vs Whole)
  "red-chilli": [
    { id: "powder", name: "Powder", shortName: "Powder", name_ur: "پسی ہوئی لال مرچ", image: "/products/red-chilli-powder.jpg" },
    { id: "whole", name: "Whole", shortName: "Whole", name_ur: "ثابت لال مرچ", image: "/products/red-chilli.jpg" },
  ],
  // Turmeric (Powder vs Whole Root)
  turmeric: [
    { id: "powder", name: "Powder", shortName: "Powder", name_ur: "ہلدی پاؤڈر", image: "/products/haldi-powder.jpg" },
    { id: "whole-root", name: "Whole Root", shortName: "Whole Root", name_ur: "ثابت گانٹھ", image: "/products/haldi-whole.jpg" },
  ],
  // Zeera (White vs Black)
  zeera: [
    { id: "white", name: "White", shortName: "White", name_ur: "سفید زیرہ", image: "/products/zeera.jpg" },
    { id: "black", name: "Black", shortName: "Black", name_ur: "کالا زیرہ (شاہ زیرہ)", image: "/products/zeera-black.jpg" },
  ],
};

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

export function variantImage(product: { name?: string | null; image_url?: string | null }, variant?: string | null) {
  if (!variant) return product.image_url ?? null;
  const options = getProductClassifications(product);
  const vNorm = variant.toLowerCase().trim();
  const option = options.find((c) => {
    const cName = c.name.toLowerCase();
    const cId = c.id.toLowerCase();
    const cShort = (c.shortName || "").toLowerCase();
    if (cName === vNorm || cId === vNorm || cShort === vNorm) return true;
    if ((vNorm.includes("without cap") || vNorm.includes("uncapped") || vNorm.includes("without shell") || vNorm.includes("shelled") || vNorm.includes("kernels") || vNorm.includes("giri")) && (c.id === "kernels" || c.id === "without-shell" || c.id === "without-cap")) return true;
    if ((vNorm.includes("with cap") || vNorm.includes("capped") || vNorm.includes("in-shell") || vNorm.includes("cap")) && (c.id === "inshell" || c.id === "capped" || c.id === "cap")) return true;
    if ((vNorm.includes("whole root") || vNorm.includes("root") || vNorm.includes("ganth")) && (c.id === "whole-root" || c.id === "whole")) return true;
    if ((vNorm.includes("powder") || vNorm.includes("pisa") || vNorm.includes("pisi")) && c.id === "powder") return true;
    if ((vNorm.includes("whole") || vNorm.includes("sabat") || vNorm.includes("sabit")) && (c.id === "whole" || c.id === "inshell")) return true;
    if ((vNorm.includes("roasted") || vNorm.includes("salted") || vNorm.includes("bhuna")) && c.id === "roasted") return true;
    if ((vNorm.includes("plain") || vNorm.includes("raw") || vNorm.includes("sada")) && c.id === "plain") return true;
    if ((vNorm.includes("black") || vNorm.includes("kala") || vNorm.includes("shah")) && (c.id === "black" || c.id === "kala")) return true;
    if ((vNorm.includes("white") || vNorm.includes("safaid") || vNorm.includes("safed")) && (c.id === "white" || c.id === "safaid")) return true;
    return false;
  });
  return option?.image ?? product.image_url ?? null;
}

// Cart lines and order items carry the chosen option; "" means the product has none.
export function normalizeVariant(product: { name?: string | null }, variant?: string | null) {
  const options = getProductClassifications(product);
  if (options.length === 0) return "";
  return options.find((c) => c.name === variant)?.name ?? options[0].name;
}

export function getProductClassifications(product?: { name?: string | null; id?: number | null }): ProductClassification[] {
  if (!product || !product.name) return [];
  const n = product.name.toLowerCase().trim();

  // Exclude standalone products from matching generic substring keywords:
  if (n.includes("round") || n.includes("gol mirch") || n.includes("flakes") || n.includes("dara mirch")) {
    return [];
  }

  if (n.includes("walnut") || n.includes("akhrot")) return PRODUCT_CLASSIFICATIONS.walnuts;
  if (n.includes("clove") || n.includes("laung") || n.includes("long")) return PRODUCT_CLASSIFICATIONS.cloves;
  if (n.includes("pista") || n.includes("pistachio")) return PRODUCT_CLASSIFICATIONS.pista;
  if (n.includes("kaju") || n.includes("cashew")) return PRODUCT_CLASSIFICATIONS.cashews;
  if (n.includes("garam masala")) return PRODUCT_CLASSIFICATIONS["garam-masala"];
  if (n.includes("black pepper") || n.includes("kaali mirch") || n.includes("kali mirch")) return PRODUCT_CLASSIFICATIONS["black-pepper"];
  if (n.includes("red chilli") || n.includes("laal mirch")) return PRODUCT_CLASSIFICATIONS["red-chilli"];
  if (n.includes("turmeric") || n.includes("haldi")) return PRODUCT_CLASSIFICATIONS.turmeric;
  if (n.includes("zeera") || n.includes("cumin")) return PRODUCT_CLASSIFICATIONS.zeera;

  return [];
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
  }];
});
