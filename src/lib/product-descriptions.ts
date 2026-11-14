export interface ProductDetailInfo {
  tagline: string;
  description: string;
  flavorProfile: string;
  culinaryUses: string[];
  healthHighlights: string[];
  storageAdvice: string;
}

export const PRODUCT_DESCRIPTIONS: Record<string, ProductDetailInfo> = {
  "Sunflower Seeds": {
    tagline: "Sun-ripened, raw kernels bursting with plant-based protein and natural vitamin E.",
    description:
      "Harvested from sun-drenched fields in the USA, our raw sunflower seeds are carefully dehusked to deliver pristine, whole kernels with a delicate buttery crunch. Naturally rich in vitamin E, magnesium, and selenium, these seeds are free from added oils, salt, or artificial preservatives. Triple-cleaned to ensure zero shell fragments or dust, they offer an unadulterated, wholesome crunch for health-conscious kitchens.",
    flavorProfile: "Mildly nutty, buttery, tender-crisp texture.",
    culinaryUses: [
      "Sprinkle over breakfast granolas, oatmeal, and yogurt bowls.",
      "Toss into fresh garden salads for a light, satisfying crunch.",
      "Blend into homemade multigrain breads, muffins, and energy bars.",
      "Lightly toast in a dry skillet with a pinch of pink salt for an artisanal afternoon snack.",
    ],
    healthHighlights: ["Rich in Vitamin E (Antioxidant power)", "Plant protein & dietary fiber", "High in Magnesium & Zinc"],
    storageAdvice: "Store in an airtight glass jar in a cool, dry pantry. Keep refrigerated during hot summer months to preserve natural oils.",
  },
  "Almonds": {
    tagline: "California Nonpareil supreme grade almonds with signature sweetness and crisp bite.",
    description:
      "Hand-selected from top California orchards, our supreme-grade almonds feature a smooth, uniform golden skin and a plump, creamy kernel. We source solely single-origin, high-grade nuts that have undergone meticulous triple-sorting to eliminate broken or shriveled pieces. Perfect for traditional soaking overnight (bheegay badam) or daily wholesome snacking.",
    flavorProfile: "Sweet, subtle floral undertones, firm and crisp snap.",
    culinaryUses: [
      "Traditional morning soaked and peeled almonds for brain health and vitality.",
      "Finely slivered as a royal garnish for kheer, zarda, halwa, and sheer khurma.",
      "Ground into homemade almond flour for gluten-free baking and delicate sweets.",
    ],
    healthHighlights: ["Heart-healthy monounsaturated fats", "Packed with Vitamin E & Biotin", "Natural plant protein"],
    storageAdvice: "Keep in an airtight container in a cool, dry place away from direct sunlight.",
  },
  "Cashew Nuts": {
    tagline: "Premium whole W320 grade Vietnamese cashews with silky, melt-in-mouth richness.",
    description:
      "Sourced directly from certified processors in Vietnam, our W320 grade cashew nuts represent the international gold standard in whole white kernels. Each cashew is graded for size, pale ivory color, and complete structural integrity with zero scorched spots. Renowned for their naturally sweet, buttery flavor profile and decadent, creamy texture.",
    flavorProfile: "Rich, creamy, naturally sweet, with a velvety finish.",
    culinaryUses: [
      "Pureed into rich korma and karahi gravies for a luxurious Mughlai base.",
      "Roasted with desi ghee and whole black pepper for an upscale evening treat.",
      "Layered into traditional mithais, kaju katli, and festival sweet trays.",
    ],
    healthHighlights: ["Rich in healthy monounsaturated fats", "Good source of copper & magnesium", "Zero trans-fats"],
    storageAdvice: "Store sealed in an airtight container to prevent moisture absorption and retain crunch.",
  },
  "Cashews (Kaju)": {
    tagline: "Premium whole white cashews — available in silky raw plain or artisanal slow-roasted.",
    description:
      "Our dual-selection Vietnamese cashews give you the choice between silky raw white kernels or artisanal slow dry-roasted whole cashews. Prepared without artificial additives or heavy oils, every kernel is curated for uniform size, high density, and pristine flavor.",
    flavorProfile: "Buttery, nutty, smooth, and delicately savory when roasted.",
    culinaryUses: [
      "Blend into creamy curries and sauces for restaurant-style richness.",
      "Serve as an elegant tea-time dry fruit offering.",
    ],
    healthHighlights: ["Healthy unsaturated fats", "Natural plant protein", "Essential minerals (Zinc & Iron)"],
    storageAdvice: "Store in a cool, dark place in an airtight glass jar.",
  },
  "Pistachios (Pista)": {
    tagline: "Naturally smile-opened Iranian pistachios with vibrant emerald-green kernels.",
    description:
      "Grown in the renowned mineral-rich soils of Iran, our premium pistachios are naturally tree-ripened and sun-opened, ensuring easy shell removal and pristine kernel flavor. Known for their distinct emerald hue, firm crunch, and complex floral nuttiness, they bring authentic Middle Eastern and Persian dry fruit excellence to your table.",
    flavorProfile: "Earthy, floral, delicate sweetness with a clean, crisp crack.",
    culinaryUses: [
      "Essential garnish for Pakistani sweets: kheer, firni, kulfi, and halwa.",
      "Crushed over Kashmiri pink chai and traditional green tea (qehwa).",
      "Eaten whole by the handful as a nutrient-dense luxury snack.",
    ],
    healthHighlights: ["Rich in eye-protecting Lutein & Zeaxanthin", "High in Vitamin B6", "Low calorie to protein ratio"],
    storageAdvice: "Keep tightly sealed in a glass container. Avoid humid conditions to maintain optimal shell crispness.",
  },
  "Walnuts (Akhrot)": {
    tagline: "Hand-selected mountain walnuts with plump golden kernels and zero bitterness.",
    description:
      "Harvested from pristine high-altitude orchards, our premium walnuts are prized for their tender, golden-amber kernels and clean, buttery palate without the dry astringency found in commercial varieties. Triple-cleaned and gently graded, they are available as whole paper-thin shell (kaghzi) or freshly extracted whole halves (giri).",
    flavorProfile: "Deeply buttery, earthy, velvety, and naturally smooth.",
    culinaryUses: [
      "Enjoyed raw daily with morning milk and honey for cognitive health.",
      "Finely chopped into walnut cakes, artisan sourdoughs, and date-walnut rolls.",
      "Stirred into rich winter panjeeri and traditional gond laddoos.",
    ],
    healthHighlights: ["Highest plant Omega-3 (ALA) of all nuts", "Potent polyphenol antioxidants", "Supports brain and cardiovascular health"],
    storageAdvice: "Store in an airtight jar in the refrigerator to protect the delicate omega-3 fatty acids from oxidation.",
  },
  "Kishmish": {
    tagline: "Plump, sun-cured Afghan Sundarkhani raisins with caramel sweetness.",
    description:
      "Sourced directly from northern Afghanistan, our long-grain Sundarkhani raisins are gently dried in shade-ventilated earthen rooms (kashmish khanas) to preserve their natural pale-golden color, soft chew, and honeyed flavor. Free from sulfur dioxide bleaches and artificial sweeteners.",
    flavorProfile: "Naturally honeyed, juicy chew, subtle tart finish.",
    culinaryUses: [
      "Folded into festive biryanis, Kabuli pulao, and fragrant saffron rice dishes.",
      "Sweet garnish for sheer khurma, halwa, and suji desserts.",
      "A wholesome, quick energy-boosting natural snack for children and adults.",
    ],
    healthHighlights: ["High in natural iron & potassium", "Dietary fiber for digestion", "Clean quick energy"],
    storageAdvice: "Keep in a cool, dry place in an airtight container to preserve their plump, tender texture.",
  },
  "Pumpkin Seeds": {
    tagline: "Raw, dark-emerald AA-grade pepitas loaded with natural zinc and vitality.",
    description:
      "Triple-sorted from the finest harvest in Vietnam, our pumpkin seeds (pepitas) are naturally hull-less, plump, and deeply pigmented green. Packed with plant sterols, zinc, and bioavailable magnesium, they deliver a satisfying savory crunch with zero added salt or chemicals.",
    flavorProfile: "Richly savory, earthy, firm and nutty crunch.",
    culinaryUses: [
      "Scatter generously over soups, roasted pumpkin, and salads.",
      "Blend into keto seed smoothies and homemade seed butter.",
      "Bake into artisanal seed loaves, crackers, and healthy breakfast bars.",
    ],
    healthHighlights: ["Exceptional source of Zinc (Immunity booster)", "High in Magnesium for muscle & sleep", "Rich in Plant Sterols"],
    storageAdvice: "Seal tightly in a cool pantry or refrigerate to preserve natural vitality.",
  },
  "Chia Seeds": {
    tagline: "Raw organic black chia seeds with maximum gelling power and plant omega-3s.",
    description:
      "Cultivated under stringent agricultural standards in the USA, our premium whole chia seeds are 99.9% purity-cleaned to eliminate weed seeds and grit. When soaked, each microscopic seed absorbs up to 12 times its weight in water, forming a soothing, nutrient-dense gel that supports hydration and gut health.",
    flavorProfile: "Neutral, mild, with a pleasant tender poppy texture.",
    culinaryUses: [
      "Stir into water with fresh lemon and honey for an energizing hydration tonic.",
      "Whisk with coconut or dairy milk for overnight chia pudding.",
      "Blend invisibly into fruit smoothies and fresh juices.",
    ],
    healthHighlights: ["Incredible source of soluble fiber", "Loaded with Omega-3 Alpha-Linolenic Acid", "Sustained hydration and satiety"],
    storageAdvice: "Store in an airtight container in a dry pantry away from moisture.",
  },
  "Sonf": {
    tagline: "Lush green, sweet Lucknowi fennel seeds with intensely refreshing aroma.",
    description:
      "Hand-graded for vibrant green color and slender seed structure, our premium Sonf delivers an intensely sweet, cooling licorice fragrance. Free from artificial green colorings, it is harvested at peak maturity to ensure high anethole essential oil content.",
    flavorProfile: "Sweet, cooling, refreshing aniseed and menthol aroma.",
    culinaryUses: [
      "Traditional after-meal mukhwas (mouth freshener) and digestive tea.",
      "Essential component of Biryani potli masala, Nihari, and Achar blends.",
      "Steeped with green tea leaves for soothing bloated stomach relief.",
    ],
    healthHighlights: ["Natural digestive carminative", "Soothes acid reflux and gas", "Natural mouth freshener"],
    storageAdvice: "Keep sealed in an airtight glass container to prevent volatile aromatics from escaping.",
  },
  "Flax Seeds": {
    tagline: "Golden-brown Ukrainian whole flaxseeds rich in lignans and heart-healthy fiber.",
    description:
      "Directly imported from Ukraine's fertile agricultural plains, our whole flaxseeds (alsi) are thoroughly triple-cleaned. An ancient superfood revered for centuries, flaxseed is the world's richest plant source of lignan antioxidants and soluble mucilaginous fiber.",
    flavorProfile: "Nutty, earthy, pleasant firm crunch.",
    culinaryUses: [
      "Freshly ground into morning porridge, warm milk, or rotis.",
      "Stirred into traditional winter Alsi Pinniyan with desi ghee and nuts.",
      "Used as an egg-replacement binder in vegan baking.",
    ],
    healthHighlights: ["Richest plant source of Lignans", "Promotes cardiovascular and hormonal balance", "High soluble & insoluble fiber"],
    storageAdvice: "Store whole seeds in an airtight jar in a dark place. Once ground, store in the refrigerator.",
  },
  "Kalonji": {
    tagline: "Pure Syrian black seed (Nigella sativa) — the revered herbal remedy seed.",
    description:
      "Celebrated across Islamic and traditional eastern medicine as a panacea for well-being, our Kalonji is imported from the historic growing regions of Syria. These tiny, jet-black triangular seeds pack an intense aromatic punch combining hints of oregano, toasted onion, and cracked black pepper.",
    flavorProfile: "Pungent, herbaceous, warm peppery-onion notes.",
    culinaryUses: [
      "Pressed into hot restaurant-style Roghani naan and kulchas.",
      "Essential foundation for traditional homemade mango and mixed vegetable pickles (achar).",
      "Swallowed with raw honey in the morning for holistic wellness.",
    ],
    healthHighlights: ["High concentration of Thymoquinone (TQ)", "Powerful anti-inflammatory and immune support", "Supports respiratory health"],
    storageAdvice: "Keep in an airtight jar away from heat and light.",
  },
  "Red Chilli": {
    tagline: "Single-origin Kunri red chillies offering brilliant natural color and balanced heat.",
    description:
      "Sourced directly from Kunri in Sindh — the red chilli capital of Asia — our chillies are dried under the desert sun and stone-ground to preserve their vibrant natural red carotenoids. Unlike mass-market powders, our chilli contains zero artificial food dyes, brick powder, or adulterants.",
    flavorProfile: "Bright, sun-ripened, bold fruity heat with deep smoky undertones.",
    culinaryUses: [
      "The definitive backbone for authentic Pakistani curries, salans, and daals.",
      "Whisked into spicy tandoori marinades for tikka and kebabs.",
    ],
    healthHighlights: ["Rich in natural Capsaicin", "Metabolic boosting properties", "Zero added colorants or adulteration"],
    storageAdvice: "Keep in a dark, dry pantry in an airtight spice container.",
  },
  "Turmeric": {
    tagline: "Single-origin Changa Manga golden turmeric with high natural curcumin.",
    description:
      "Cultivated in Punjab's pristine irrigated soils, our whole cured turmeric fingers are cleaned and slowly milled at low temperatures. Retaining their deep golden-orange hue and rich curcuminoids, our haldi provides genuine restorative warmth without commercial starch fillers.",
    flavorProfile: "Warm, earthy, slightly peppery, deeply aromatic.",
    culinaryUses: [
      "Everyday foundational spice for all Pakistani gravies, vegetables, and lentils.",
      "Simmered with whole milk and black pepper for restorative golden milk (haldi doodh).",
    ],
    healthHighlights: ["Potent Curcumin antioxidant & anti-inflammatory", "Joint and recovery support", "100% pure single-origin"],
    storageAdvice: "Store in a dark glass container away from direct sunlight to preserve curcumin potency.",
  },
  "Chilli Flakes (Dara Mirch)": {
    tagline: "Coarsely crushed sun-dried red chillies with roasted seeds for vibrant tarka.",
    description:
      "Crafted from premium Sindh sun-dried red chillies crushed with their seeds intact to provide both color contrast and sudden bursts of fiery heat. Essential for rustic roadside karahis, spicy pizzas, and sizzled garlic oil tempering.",
    flavorProfile: "Punchy, smoky, localized bursts of fiery heat.",
    culinaryUses: [
      "Sizzling tarka atop daal maash, daal chana, and haleem.",
      "Sprinkled over artisanal pizzas, pasta, and spicy eggs.",
    ],
    healthHighlights: ["Natural capsaicin", "Stimulates digestion and circulation"],
    storageAdvice: "Store tightly sealed to keep seeds crisp and flakes dry.",
  },
  "Gol Mirch (Round Red Chilli)": {
    tagline: "Whole button chillies from Sindh for royal aromatic tempering.",
    description:
      "Round, glossy whole dried button chillies selected for their intact shape, deep red skin, and aromatic seeds. When flash-fried in hot ghee or oil, they puff up and release a warm, nutty aroma without scorching the dish.",
    flavorProfile: "Mellow smoky heat, nutty when fried in hot ghee.",
    culinaryUses: [
      "The crown jewel of traditional Punjabi and Sindhi daal tarka.",
      "Essential for Degi Biryani, Achari Gosht, and baghaar.",
    ],
    healthHighlights: ["Natural digestive stimulant", "Whole uncrushed purity"],
    storageAdvice: "Keep in a dry container in a cool kitchen pantry.",
  },
  "Black Pepper (Kaali Mirch)": {
    tagline: "Bold Tellicherry-style black peppercorns bursting with pungent piperine heat.",
    description:
      "Known as the King of Spices, our whole black peppercorns are selected for high density and wrinkled, dark brown-to-black berries. Packed with volatile essential oils and piperine, they release an intensely sharp, woody aroma when cracked fresh.",
    flavorProfile: "Intensely pungent, sharp, woody, with a lingering warming heat.",
    culinaryUses: [
      "Freshly cracked over white karahi, black pepper chicken, and steaks.",
      "Whole in yakhni pulao, beef stew, and aromatic bone broths.",
    ],
    healthHighlights: ["Enhances nutrient absorption (especially Curcumin)", "Stimulates gastric secretions for smooth digestion"],
    storageAdvice: "Store whole peppercorns in a tight container and grind just before use for maximum aroma.",
  },
  "Garam Masala": {
    tagline: "Royal Mughlai heirloom blend of whole roasted spices, hand-crafted in small batches.",
    description:
      "An authentic royal formulation combining whole black peppercorns, cloves, green cardamom, black cardamom, cinnamon bark, cumin, and mace. Small-batch dry-roasted over low heat to release their volatile essential oils before gentle milling.",
    flavorProfile: "Complex, sweet-spicy, aromatic, and deeply warming.",
    culinaryUses: [
      "Finish curries, qormas, and gravies with a pinch just before serving.",
      "Stir into biryani layers and qeema for authentic wedding-style fragrance.",
    ],
    healthHighlights: ["Metabolic warming spices", "Zero fillers, salt, or artificial flavoring"],
    storageAdvice: "Keep tightly capped in an airtight glass spice jar.",
  },
  "Zeera (Cumin)": {
    tagline: "High-volatile-oil whole cumin seeds with intense earthy and citrus fragrance.",
    description:
      "Thoroughly machine-cleaned and sieved to remove stems, stones, and dust. Our whole cumin seeds feature a high concentration of cuminaldehyde, which blooms into an irresistible earthy, nutty fragrance upon meeting hot ghee or dry roasting.",
    flavorProfile: "Earthy, warm, slightly bitter-citrusy notes.",
    culinaryUses: [
      "Foundational base for zeera rice, daal tarka, and raita.",
      "Dry-roasted and ground for fresh chaat masala and salads.",
    ],
    healthHighlights: ["Aids healthy digestion & bile flow", "Naturally rich in iron"],
    storageAdvice: "Store in a cool dry spice jar. Toast gently in a dry pan before cooking.",
  },
  "Green Cardamom": {
    tagline: "Jumbo 8mm bold green cardamom pods from Guatemala, packed with aromatic black seeds.",
    description:
      "The Queen of Spices. Sourced directly from premier estate growers in Guatemala, our jumbo 8mm pods are intensely vibrant green with intact husks. Opening a single pod reveals densely packed, oil-rich black seeds with an intoxicating floral-eucalyptus fragrance.",
    flavorProfile: "Floral, sweet, menthol-cooling with citrus undertones.",
    culinaryUses: [
      "Essential for royal desserts: kheer, sheer khurma, and rasmalai.",
      "Cracked into daily morning milk chai, Peshawari qehwa, and Kashmiri chai.",
      "Whole in Degi Biryani and rich meat yakhni.",
    ],
    healthHighlights: ["Natural breath freshener", "Soothes digestion and eases nausea"],
    storageAdvice: "Keep pods closed until ready to use. Store in an airtight tin in a dark drawer.",
  },
  "Black Cardamom": {
    tagline: "Whole smoke-cured large black cardamom pods for rich rustic curries.",
    description:
      "Harvested in the eastern sub-Himalayan valleys, our large black cardamom pods are traditionally cured over open wood fires. The result is an intense smoky, resinous, and camphoraceous aroma that imparts incomparable depth to hearty meat dishes.",
    flavorProfile: "Deeply smoky, resinous, camphor-like, savory.",
    culinaryUses: [
      "Indispensable in Nihari, Haleem, Beef Pulao, and Roghan Josh.",
      "Infused into slow-cooked lentils and winter bone broths.",
    ],
    healthHighlights: ["Supports respiratory and gastrointestinal health"],
    storageAdvice: "Store sealed in a dry container.",
  },
  "Cloves": {
    tagline: "Hand-picked whole Indonesian cloves with intact heads and intense eugenol oil.",
    description:
      "Our cloves are hand-harvested in Indonesia at peak bud formation before flowering, ensuring every clove retains its prized flower crown. Rich in natural eugenol oil, a single clove delivers an intensely aromatic, sweet-numbing warmth.",
    flavorProfile: "Sweet, pungent, intensely warming with a gentle numbing note.",
    culinaryUses: [
      "Simmered in meat stocks, yakhni, and aromatic biryani rice.",
      "Infused into winter teas, spiced ciders, and herbal infusions.",
    ],
    healthHighlights: ["Highest ORAC antioxidant rating among culinary spices", "Potent antimicrobial and oral health properties"],
    storageAdvice: "Store in an airtight jar away from heat sources.",
  },
  "Oats": {
    tagline: "Pure 100% whole grain rolled oats for creamy morning breakfasts and wholesome vitality.",
    description:
      "Grown in Pakistan's cooler agricultural zones, our rolled oats are steam-kilned and gently rolled to maintain the whole bran, endosperm, and germ. Delivering slow-burning complex carbohydrates and beta-glucan soluble fiber for all-day steady energy.",
    flavorProfile: "Subtly nutty, toasty, creamy and comforting when cooked.",
    culinaryUses: [
      "Cooked with milk, dates, and nuts for a nutrient-dense breakfast porridge.",
      "Blended into healthy fruit smoothies and protein shakes.",
      "Used to prepare healthy desi oat halwa or baked into wholesome cookies.",
    ],
    healthHighlights: ["Rich in Beta-Glucan for healthy cholesterol balance", "Low glycemic index sustained energy", "High in dietary fiber"],
    storageAdvice: "Keep tightly sealed in a dry place. Protect from moisture and humidity.",
  },
  "Ispaghol Chilka": {
    tagline: "Fine white psyllium husk — 100% pure soluble dietary fiber with zero grit.",
    description:
      "Sourced from the premium psyllium harvest, our Ispaghol Chilka is triple-sifted to ensure complete purity, a bright translucent white appearance, and zero sand or grit. When mixed with liquid, it expands gently into a soothing natural fiber gel that promotes gut health and effortless digestion.",
    flavorProfile: "Virtually flavorless, creates a smooth, gentle gel.",
    culinaryUses: [
      "Stirred into cold water, milk, or fresh fruit juice and consumed immediately.",
      "Blended with yogurt (dahi) and a pinch of roasted cumin for digestive soothe.",
      "Used as a gluten-free fiber binder in keto and specialized breads.",
    ],
    healthHighlights: ["100% natural soluble fiber", "Promotes smooth, comfortable digestion", "Supports heart and metabolic health"],
    storageAdvice: "Store in a dry airtight container. Always use a dry spoon to prevent clumping.",
  },
};

export function getProductDetailInfo(productName?: string | null): ProductDetailInfo {
  if (!productName) return PRODUCT_DESCRIPTIONS["Sunflower Seeds"];
  for (const [key, info] of Object.entries(PRODUCT_DESCRIPTIONS)) {
    if (productName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(productName.toLowerCase())) {
      return info;
    }
  }
  return {
    tagline: "100% pure, single-origin commodity directly from harvest source.",
    description:
      "Hand-selected and triple-cleaned to deliver premium quality, unadulterated purity, and authentic natural flavor for discerning Pakistani households.",
    flavorProfile: "Authentic, fresh, unadulterated natural flavor.",
    culinaryUses: ["Ideal for everyday authentic cooking and wholesome family meals."],
    healthHighlights: ["100% Pure & Free from additives", "Carefully cleaned & packed for freshness"],
    storageAdvice: "Store in an airtight container in a cool, dry place.",
  };
}
