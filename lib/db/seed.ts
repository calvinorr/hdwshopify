import { db } from "./index";
import {
  categories,
  products,
  productVariants,
  productImages,
} from "./schema";

// Placeholder images from picsum for demo
const getProductImage = (id: number) =>
  `https://picsum.photos/seed/yarn${id}/800/800`;

const seed = async () => {
  console.log("🌱 Seeding database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(productImages);
  await db.delete(productVariants);
  await db.delete(products);
  await db.delete(categories);

  // Create categories (yarn weights)
  console.log("Creating categories...");
  const categoryData = [
    {
      name: "Laceweight",
      slug: "laceweight",
      description:
        "Delicate laceweight yarns perfect for shawls, wraps, and intricate lacework. Typically 800-1000m per 100g.",
      position: 1,
    },
    {
      name: "4 Ply / Fingering",
      slug: "4ply",
      description:
        "Versatile fingering weight yarn ideal for socks, shawls, and lightweight garments. Typically 350-450m per 100g.",
      position: 2,
    },
    {
      name: "DK",
      slug: "dk",
      description:
        "Double knitting weight - the most popular weight for sweaters, cardigans, and accessories. Typically 200-250m per 100g.",
      position: 3,
    },
    {
      name: "Aran",
      slug: "aran",
      description:
        "Chunky yet refined, perfect for cozy sweaters, hats, and quick projects. Typically 150-180m per 100g.",
      position: 4,
    },
    {
      name: "Mini Skeins",
      slug: "mini-skeins",
      description:
        "Small skeins perfect for colorwork, stripes, and trying new colors. 20g each.",
      position: 5,
    },
  ];

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .returning();

  const categoryMap = Object.fromEntries(
    insertedCategories.map((c) => [c.slug, c.id])
  );

  // Create products with naturally dyed yarn theme
  console.log("Creating products...");
  const productData = [
    // Laceweight
    {
      name: "Cobweb Merino Lace",
      slug: "cobweb-merino-lace",
      description: `<p>Our finest laceweight yarn, spun from 100% extra-fine merino wool. Each skein is hand-dyed using traditional botanical methods, resulting in soft, nuanced colors that reflect the natural world.</p>
<p>Perfect for heirloom shawls, wedding veils, and delicate lacework where drape and definition are paramount.</p>`,
      categoryId: categoryMap["laceweight"],
      basePrice: 24.0,
      status: "active" as const,
      featured: true,
      fiberContent: "100% Extra Fine Merino Wool",
      weight: "Laceweight",
      yardage: "875m / 956yds per 100g",
      careInstructions: "Hand wash cold, lay flat to dry",
      metaTitle: "Cobweb Merino Lace | Naturally Dyed Laceweight Yarn",
      metaDescription:
        "Hand-dyed extra fine merino laceweight yarn. 875m per 100g skein. Perfect for shawls and delicate lacework.",
    },
    {
      name: "Silk Cloud Lace",
      slug: "silk-cloud-lace",
      description: `<p>A dreamy blend of mulberry silk and baby alpaca, creating a yarn with incredible sheen and softness. The silk takes natural dyes beautifully, producing jewel-like depths of color.</p>
<p>Ideal for luxury shawls and special occasion pieces that deserve something extraordinary.</p>`,
      categoryId: categoryMap["laceweight"],
      basePrice: 32.0,
      status: "active" as const,
      featured: false,
      fiberContent: "70% Mulberry Silk, 30% Baby Alpaca",
      weight: "Laceweight",
      yardage: "800m / 875yds per 100g",
      careInstructions: "Hand wash cold with silk-safe detergent, lay flat to dry",
      metaTitle: "Silk Cloud Lace | Silk Alpaca Laceweight Yarn",
      metaDescription:
        "Luxurious silk and alpaca blend laceweight yarn. Hand-dyed with botanical dyes. 800m per 100g.",
    },

    // 4 Ply
    {
      name: "Heritage BFL 4 Ply",
      slug: "heritage-bfl-4ply",
      description: `<p>Our signature sock yarn, spun from British Bluefaced Leicester wool. BFL is renowned for its next-to-skin softness and excellent stitch definition, making it perfect for socks that last.</p>
<p>Each colorway is inspired by the wildflowers and landscapes of the Irish countryside.</p>`,
      categoryId: categoryMap["4ply"],
      basePrice: 22.0,
      status: "active" as const,
      featured: true,
      fiberContent: "100% British Bluefaced Leicester",
      weight: "4ply",
      yardage: "400m / 437yds per 100g",
      careInstructions: "Machine wash gentle 30°C, tumble dry low",
      metaTitle: "Heritage BFL 4 Ply | British Wool Sock Yarn",
      metaDescription:
        "British Bluefaced Leicester 4ply sock yarn. Naturally dyed, incredibly soft. 400m per 100g.",
    },
    {
      name: "Meadow Sock",
      slug: "meadow-sock",
      description: `<p>A durable sock yarn blending superwash merino with nylon for extra strength. The merino provides softness and warmth, while the nylon ensures your handknit socks will endure years of happy wearing.</p>
<p>Dyed with plants foraged from local meadows and hedgerows.</p>`,
      categoryId: categoryMap["4ply"],
      basePrice: 20.0,
      status: "active" as const,
      featured: true,
      fiberContent: "75% Superwash Merino, 25% Nylon",
      weight: "4ply",
      yardage: "425m / 465yds per 100g",
      careInstructions: "Machine wash 30°C, lay flat to dry",
      metaTitle: "Meadow Sock | Merino Nylon Sock Yarn",
      metaDescription:
        "Durable superwash merino and nylon sock yarn. Naturally dyed. 425m per 100g.",
    },
    {
      name: "Alpaca Silk Fingering",
      slug: "alpaca-silk-fingering",
      description: `<p>Pure luxury in fingering weight. This blend of baby alpaca and silk creates a yarn with incredible drape and a subtle halo. The colors have a watercolor quality unique to this fiber blend.</p>
<p>Perfect for next-to-skin garments and elegant accessories.</p>`,
      categoryId: categoryMap["4ply"],
      basePrice: 28.0,
      status: "active" as const,
      featured: false,
      fiberContent: "70% Baby Alpaca, 30% Silk",
      weight: "4ply",
      yardage: "380m / 415yds per 100g",
      careInstructions: "Hand wash cold, lay flat to dry away from direct sunlight",
      metaTitle: "Alpaca Silk Fingering | Luxury Fingering Weight Yarn",
      metaDescription:
        "Baby alpaca and silk fingering weight yarn. Hand-dyed with botanical dyes. 380m per 100g.",
    },

    // DK
    {
      name: "Flock DK",
      slug: "flock-dk",
      description: `<p>Our workhorse DK yarn, spun from carefully selected British Falkland wool. This wool has a beautiful lustre and takes natural dyes exceptionally well, creating rich, saturated colors.</p>
<p>The perfect choice for sweaters, cardigans, and accessories that will become wardrobe staples.</p>`,
      categoryId: categoryMap["dk"],
      basePrice: 18.0,
      status: "active" as const,
      featured: true,
      fiberContent: "100% British Falkland Wool",
      weight: "DK",
      yardage: "225m / 246yds per 100g",
      careInstructions: "Hand wash cold or machine wash wool cycle, lay flat to dry",
      metaTitle: "Flock DK | British Wool DK Weight Yarn",
      metaDescription:
        "British Falkland DK yarn, naturally dyed. Perfect for sweaters and cardigans. 225m per 100g.",
    },
    {
      name: "Moorland DK",
      slug: "moorland-dk",
      description: `<p>A rustic DK blending Shetland wool with British alpaca. The Shetland provides traditional character and warmth, while the alpaca adds softness and drape. Colors are inspired by the wild moorlands of Northern Ireland.</p>`,
      categoryId: categoryMap["dk"],
      basePrice: 20.0,
      status: "active" as const,
      featured: false,
      fiberContent: "60% Shetland Wool, 40% British Alpaca",
      weight: "DK",
      yardage: "210m / 230yds per 100g",
      careInstructions: "Hand wash cold, reshape and lay flat to dry",
      metaTitle: "Moorland DK | Shetland Alpaca Blend Yarn",
      metaDescription:
        "Shetland and alpaca blend DK yarn. Naturally dyed in moorland-inspired colors. 210m per 100g.",
    },
    {
      name: "Merino DK Superwash",
      slug: "merino-dk-superwash",
      description: `<p>All the softness of merino with the convenience of machine washability. This superwash merino DK is perfect for baby knits, children's garments, and anything that needs easy care without sacrificing quality.</p>`,
      categoryId: categoryMap["dk"],
      basePrice: 19.0,
      status: "active" as const,
      featured: true,
      fiberContent: "100% Superwash Merino Wool",
      weight: "DK",
      yardage: "230m / 251yds per 100g",
      careInstructions: "Machine wash 30°C, tumble dry low",
      metaTitle: "Merino DK Superwash | Easy Care DK Yarn",
      metaDescription:
        "Superwash merino DK yarn. Machine washable, naturally dyed. 230m per 100g.",
    },

    // Aran
    {
      name: "Cottage Aran",
      slug: "cottage-aran",
      description: `<p>A traditional 5-ply aran weight yarn, perfect for classic cable sweaters and cozy accessories. Spun from British wool with excellent stitch definition and a slight rustic character.</p>
<p>Each skein is dyed using recipes passed down through generations of natural dyers.</p>`,
      categoryId: categoryMap["aran"],
      basePrice: 16.0,
      status: "active" as const,
      featured: true,
      fiberContent: "100% British Wool",
      weight: "Aran",
      yardage: "165m / 180yds per 100g",
      careInstructions: "Hand wash cold, lay flat to dry",
      metaTitle: "Cottage Aran | Traditional British Aran Yarn",
      metaDescription:
        "Traditional British wool aran yarn. Naturally dyed, perfect for cables. 165m per 100g.",
    },
    {
      name: "Heather Aran",
      slug: "heather-aran",
      description: `<p>A luxurious aran blending merino, cashmere, and silk. Despite its decadent composition, this yarn is surprisingly practical - the merino provides durability while the cashmere and silk add incomparable softness.</p>`,
      categoryId: categoryMap["aran"],
      basePrice: 28.0,
      status: "active" as const,
      featured: false,
      fiberContent: "70% Merino, 20% Cashmere, 10% Silk",
      weight: "Aran",
      yardage: "155m / 170yds per 100g",
      careInstructions: "Hand wash cold with cashmere shampoo, lay flat to dry",
      metaTitle: "Heather Aran | Luxury Cashmere Blend Aran Yarn",
      metaDescription:
        "Merino, cashmere, and silk aran blend. Naturally dyed luxury yarn. 155m per 100g.",
    },

    // Mini Skeins
    {
      name: "Mini Skein Set - Botanical",
      slug: "mini-skein-set-botanical",
      description: `<p>A curated set of 5 mini skeins showcasing our botanical dye range. Each 20g skein is dyed with a different plant - from indigo blue to madder red to weld yellow.</p>
<p>Perfect for colorwork projects, heels and toes, or simply collecting beautiful colors.</p>`,
      categoryId: categoryMap["mini-skeins"],
      basePrice: 24.0,
      status: "active" as const,
      featured: true,
      fiberContent: "100% Superwash Merino",
      weight: "4ply",
      yardage: "5 x 85m / 93yds (20g each)",
      careInstructions: "Machine wash 30°C, lay flat to dry",
      metaTitle: "Mini Skein Set - Botanical | Naturally Dyed Mini Skeins",
      metaDescription:
        "Set of 5 naturally dyed mini skeins. Perfect for colorwork. 5 x 20g skeins.",
    },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(productData)
    .returning();

  // Create colorway variants for each product
  console.log("Creating product variants...");

  const colorways = [
    // Natural/neutral colors
    { name: "Undyed Natural", hex: "#F5F5DC" },
    { name: "Oatmeal", hex: "#D4C4A8" },
    { name: "Stone", hex: "#8B8378" },
    { name: "Charcoal", hex: "#36454F" },
    // Plant-dyed colors
    { name: "Indigo Deep", hex: "#1A237E" },
    { name: "Indigo Sky", hex: "#5C6BC0" },
    { name: "Madder Red", hex: "#B71C1C" },
    { name: "Madder Coral", hex: "#E57373" },
    { name: "Weld Yellow", hex: "#F9A825" },
    { name: "Weld Gold", hex: "#FBC02D" },
    { name: "Walnut Brown", hex: "#5D4037" },
    { name: "Oak Gall Grey", hex: "#757575" },
    { name: "Logwood Purple", hex: "#4A148C" },
    { name: "Elderberry", hex: "#6A1B9A" },
    { name: "Avocado Green", hex: "#689F38" },
    { name: "Nettle Green", hex: "#33691E" },
    { name: "Onion Skin", hex: "#FF8F00" },
    { name: "Marigold", hex: "#FFB300" },
    { name: "Black Bean", hex: "#263238" },
    { name: "Iron Modified", hex: "#455A64" },
  ];

  const variantData: Array<{
    productId: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
    weightGrams: number;
    position: number;
  }> = [];

  insertedProducts.forEach((product, productIndex) => {
    // Assign 4-6 random colorways to each product
    const numColorways = 4 + Math.floor(Math.random() * 3);
    const shuffledColorways = [...colorways].sort(() => Math.random() - 0.5);
    const selectedColorways = shuffledColorways.slice(0, numColorways);

    selectedColorways.forEach((colorway, variantIndex) => {
      // Vary prices slightly for some colorways
      const priceVariation = Math.random() > 0.7 ? 2 : 0;
      const stock = Math.floor(Math.random() * 15);

      variantData.push({
        productId: product.id,
        name: colorway.name,
        sku: `${product.slug.toUpperCase().slice(0, 3)}-${colorway.name.toUpperCase().replace(/\s/g, "-").slice(0, 8)}-${productIndex}${variantIndex}`,
        price: product.basePrice + priceVariation,
        stock: stock,
        weightGrams: product.weight === "Aran" ? 100 : product.weight === "DK" ? 100 : 100,
        position: variantIndex,
      });
    });
  });

  const insertedVariants = await db
    .insert(productVariants)
    .values(variantData)
    .returning();

  // Create product images
  console.log("Creating product images...");

  const imageData: Array<{
    productId: number;
    variantId: number | null;
    url: string;
    alt: string;
    position: number;
  }> = [];

  let imageCounter = 1;

  insertedProducts.forEach((product) => {
    // Main product images (not variant-specific)
    for (let i = 0; i < 3; i++) {
      imageData.push({
        productId: product.id,
        variantId: null,
        url: getProductImage(imageCounter++),
        alt: `${product.name} - Image ${i + 1}`,
        position: i,
      });
    }
  });

  // Add some variant-specific images
  insertedVariants.slice(0, 20).forEach((variant, index) => {
    imageData.push({
      productId: variant.productId,
      variantId: variant.id,
      url: getProductImage(imageCounter++),
      alt: `${variant.name} colorway`,
      position: 0,
    });
  });

  await db.insert(productImages).values(imageData);

  console.log("✅ Seeding complete!");
  console.log(`   - ${insertedCategories.length} categories`);
  console.log(`   - ${insertedProducts.length} products`);
  console.log(`   - ${insertedVariants.length} variants`);
  console.log(`   - ${imageData.length} images`);
};

// Run the seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
