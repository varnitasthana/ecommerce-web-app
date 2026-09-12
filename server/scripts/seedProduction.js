const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB, disconnectDB } = require("../config/db");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Product = require("../models/Product");
const Review = require("../models/Review");

const DEMO_PASSWORD = "DemoShopEase#2026";
const DEMO_EMAIL_DOMAIN = "demo.shopease.local";
const DEMO_PRODUCT_PREFIX = "DEMO-";

const categoryDefinitions = [
  {
    name: "Electronics",
    code: "ELE",
    brands: ["NexaTech", "OrbitWare", "PixelPeak", "VoltCraft"],
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    products: [
      "AeroBook 14 Laptop", "PulseTab 11 Tablet", "NovaPhone X1", "EchoBuds Pro", "OrbitWatch S2",
      "VoltCharge 65W Adapter", "NexaTech Mechanical Keyboard", "PixelPeak Wireless Mouse", "ArcView 27 Monitor", "BeamCast 4K Projector",
      "SoundNest Bluetooth Speaker", "VoltCraft Power Bank", "OrbitWare Wi-Fi Router", "NexaTech USB-C Hub", "PixelPeak Webcam HD",
      "AeroBook Laptop Stand", "PulseTab Stylus Pen", "NovaPhone Protective Case", "EchoBuds Charging Case", "OrbitWatch Sport Band",
      "ArcView Monitor Light", "BeamCast HDMI Cable", "SoundNest Headphone Stand", "VoltCraft Smart Plug", "NexaTech Desk Microphone"
    ]
  },
  {
    name: "Fashion",
    code: "FAS",
    brands: ["ThreadTheory", "UrbanLoom", "MiraMode", "Northline"],
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
    products: [
      "Everyday Oxford Shirt", "Relaxed Fit Chinos", "CloudKnit Hoodie", "Linen Blend Dress", "TrailReady Sneakers",
      "Classic Denim Jacket", "Soft Ribbed Cardigan", "Essential Cotton Tee", "Pleated Midi Skirt", "Weekend Canvas Tote",
      "Minimal Leather Belt", "Avenue Chelsea Boots", "LoungeFlex Joggers", "Alpine Puffer Vest", "Studio Crossbody Bag",
      "Heritage Polo Shirt", "Daylight Running Cap", "Merino Travel Scarf", "Slim Oxford Trousers", "Everyday Ankle Socks"
    ]
  },
  {
    name: "Home & Kitchen",
    code: "HOM",
    brands: ["Hearth & Hue", "Nestora", "Cookwell", "LumaLiving"],
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    products: [
      "BrewMate Coffee Maker", "ChefStone Nonstick Pan", "LumaLiving Floor Lamp", "Nestora Storage Baskets", "Hearth & Hue Cushion Set",
      "Cookwell Spice Rack", "DailyHarvest Glass Containers", "LumaLiving Table Lamp", "Nestora Bamboo Organizer", "ChefStone Knife Set",
      "Hearth & Hue Cotton Bedsheet", "BrewMate Electric Kettle", "Cookwell Digital Scale", "Nestora Laundry Hamper", "LumaLiving Wall Mirror",
      "ChefStone Air Fryer", "Hearth & Hue Bath Towel Set", "Nestora Shoe Organizer", "BrewMate Travel Mug", "Cookwell Silicone Utensils"
    ]
  },
  {
    name: "Beauty",
    code: "BEA",
    brands: ["GlowKind", "PurePetal", "Velora", "BloomLab"],
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
    products: [
      "GlowKind Daily Face Wash", "PurePetal Hydrating Serum", "Velora Matte Lip Color", "BloomLab Mineral Sunscreen", "GlowKind Vitamin C Cream",
      "PurePetal Gentle Toner", "Velora Brow Sculpt Kit", "BloomLab Overnight Mask", "GlowKind Nourishing Hair Oil", "PurePetal Body Lotion",
      "Velora Soft Blush Palette", "BloomLab Hand Cream Set", "GlowKind Clay Detox Mask", "PurePetal Cleansing Balm", "Velora Lash Lift Mascara"
    ]
  },
  {
    name: "Sports & Fitness",
    code: "SPT",
    brands: ["PeakMotion", "FlexForge", "StrideLab", "SummitCore"],
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
    products: [
      "PeakMotion Yoga Mat", "FlexForge Resistance Bands", "StrideLab Running Shoes", "SummitCore Training Gloves", "PeakMotion Foam Roller",
      "FlexForge Adjustable Kettlebell", "StrideLab Hydration Bottle", "SummitCore Gym Towel", "PeakMotion Jump Rope", "FlexForge Core Slider Set"
    ]
  },
  {
    name: "Grocery",
    code: "GRO",
    brands: ["HarvestLane", "DailyRoot", "KindPantry", "GreenBasket"],
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    products: [
      "HarvestLane Organic Oats", "DailyRoot Arabica Coffee", "KindPantry Almonds", "GreenBasket Green Tea", "HarvestLane Brown Rice",
      "DailyRoot Cold Pressed Oil", "KindPantry Trail Mix", "GreenBasket Herbal Infusion", "HarvestLane Whole Wheat Pasta", "DailyRoot Honey Jar"
    ]
  }
];

const demoUsers = [
  { key: "admin", name: "Demo Admin", role: "admin" },
  { key: "seller-1", name: "Demo Seller One", role: "seller" },
  { key: "seller-2", name: "Demo Seller Two", role: "seller" },
  { key: "seller-3", name: "Demo Seller Three", role: "seller" },
  ...Array.from({ length: 10 }, (_, index) => ({
    key: `customer-${index + 1}`,
    name: `Demo Customer ${index + 1}`,
    role: "customer"
  }))
];

const demoEmail = (key) => `${key}@${DEMO_EMAIL_DOMAIN}`;
const roundMoney = (value) => Math.round(value * 100) / 100;

const run = async () => {
  await connectDB();
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = {};

  for (const demoUser of demoUsers) {
    const email = demoEmail(demoUser.key);
    const existing = await User.findOne({ email });
    if (existing) {
      existing.name = demoUser.name;
      existing.role = demoUser.role;
      existing.isActive = true;
      existing.isDeleted = false;
      existing.deletedAt = null;
      existing.emailVerified = true;
      existing.password = password;
      await existing.save();
      users[demoUser.key] = existing;
    } else {
      const created = await User.create({
        name: demoUser.name,
        email,
        password,
        role: demoUser.role,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
        isDeleted: false
      });
      users[demoUser.key] = created;
    }
  }

  const sellers = [users["seller-1"], users["seller-2"], users["seller-3"]];
  let globalIndex = 0;

  for (const definition of categoryDefinitions) {
    for (let index = 0; index < definition.products.length; index += 1) {
      const seller = sellers[globalIndex % sellers.length];
      const price = roundMoney(9.99 + ((index * 37 + definition.code.length * 11) % 2100));
      const discounted = index % 3 !== 1;
      const compareAtPrice = discounted ? roundMoney(price * (1.12 + (index % 4) * 0.08)) : 0;
      const stockPattern = index % 10;
      const stock = stockPattern === 0 ? 0 : stockPattern <= 2 ? 4 + index % 5 : stockPattern <= 5 ? 18 + index : 70 + index * 3;
      const name = definition.products[index];
      const sku = `${DEMO_PRODUCT_PREFIX}${definition.code}-${String(index + 1).padStart(3, "0")}`;
      const slug = sku.toLowerCase();

      await Product.findOneAndUpdate(
        { sku },
        {
          $set: {
            name,
            description: `Development catalog item for ${name.toLowerCase()}, prepared for ShopEase marketplace testing.`,
            longDescription: `Demo-only ${definition.name.toLowerCase()} listing with realistic pricing, inventory, delivery, and seller ownership data.`,
            price,
            compareAtPrice,
            category: definition.name,
            subcategory: `${definition.name} Essentials`,
            brand: definition.brands[index % definition.brands.length],
            slug,
            sku,
            image: definition.image,
            images: [definition.image],
            stock,
            lowStockThreshold: 10,
            rating: 0,
            reviewCount: 0,
            deliveryDays: 2 + (index % 5),
            weight: roundMoney(0.2 + (index % 12) * 0.15),
            dimensions: { length: 10 + index % 20, width: 8 + index % 15, height: 3 + index % 8 },
            warranty: definition.name === "Electronics" ? "12-month demo warranty" : null,
            returnPolicy: "30-day demo return policy",
            attributes: {
              condition: "New demo item",
              catalog: "ShopEase development marketplace",
              availability: stock > 0 ? "In stock" : "Out of stock"
            },
            active: true,
            deleted: false,
            deletedAt: null,
            seller: seller._id,
            views: index * 17,
            purchases: index % 6
          }
        },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
      );
    }
  }

  console.log("Seed completed successfully");
  await disconnectDB();
};

run().catch((error) => {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
});
