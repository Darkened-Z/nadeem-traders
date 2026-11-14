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
  ["Pista (Shell)", "پستہ (چھلکے والا)", "Iran", 1, "pista"],
  ["Walnuts (Akhrot, Without Cap)", "اخروٹ (گری)", "China", 1, "walnuts"],
  ["Kaju (Roasted, Plain)", "بھنے ہوئے کاجو (سادہ)", "Vietnam", 1, "kaju-roasted"],
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

  ["Black Pepper Powder", "کالی مرچ پاؤڈر", "Brazil", 4, "black-pepper"],
  ["Garam Masala (Sabat, Powder)", "گرم مصالحہ (ثابت، پسا ہوا)", null, 4, "garam-masala"],
  ["Zeera Sabit", "ثابت زیرہ", "India", 4, "zeera", 160, "100g"],
  ["Green Cardamom", "سبز الائچی", "Guatemala", 4, "green-cardamom"],
  ["Black Cardamom", "کالی الائچی", "India", 4, "black-cardamom"],
  ["Cloves", "لونگ", "Indonesia", 4, "cloves"],

  ["Oats", "جئی (اوٹس)", "Pakistan", 5, "oats"],
  ["Ispaghol Chilka", "اسپغول چھلکا", "India", 5, "ispaghol"],
];

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
