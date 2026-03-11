// scripts/seedProducts.js
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/productModel"); // Adjust path if needed

const products = [
  {
    title: "Apple iPhone 16 Pro",
    slug: "apple-iphone-16-pro",
    description:
      "The iPhone 16 Pro features a stunning 6.3-inch Super Retina XDR display, A18 Pro chip, advanced camera system with 48MP main sensor, and titanium design. Experience next-level performance with Apple Intelligence capabilities.",
    price: 999,
    category: "Smartphones",
    brand: "Apple",
    quantity: 10,
    sold: 0,
    color: "Natural Titanium",
    images: [
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-16-pro-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-16-pro-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-16-pro-3.jpg",
    ],
    ratings: [],
  },
  {
    title: "Samsung Galaxy S24 Ultra",
    slug: "samsung-galaxy-s24-ultra",
    description:
      "Galaxy S24 Ultra with built-in S Pen, 200MP camera, 6.8-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 processor, and Galaxy AI features. Titanium frame for ultimate durability.",
    price: 1299,
    category: "Smartphones",
    brand: "Samsung",
    quantity: 10,
    sold: 0,
    color: "Titanium Gray",
    images: [
      "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-5g-sm-s928-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-5g-sm-s928-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-5g-sm-s928-3.jpg",
    ],
    ratings: [],
  },
  {
    title: "Apple MacBook Air 13-inch M3",
    slug: "apple-macbook-air-13-m3-2024",
    description:
      "MacBook Air 13-inch with M3 chip delivers exceptional performance and up to 18 hours of battery life. Features 13.6-inch Liquid Retina display, 16GB unified memory, and silent fanless design.",
    price: 1299,
    category: "Laptops",
    brand: "Apple",
    quantity: 10,
    sold: 0,
    color: "Midnight",
    images: [
      "https://cdsassets.apple.com/live/7WUAS350/images/macbook-air/2025-macbook-air-13in-colors.png",
      "https://www.macvoorminder.nl/wp-content/uploads/2024/03/MacBook-Air-13-inch-M3-Midnight-2024-front.jpg.webp",
      "https://www.macvoorminder.nl/wp-content/uploads/2024/03/MacBook-Air-13-inch-M3-Midnight-2024-key.jpg.webp",
      "https://www.macvoorminder.nl/wp-content/uploads/2024/03/MacBook-Air-13-inch-M3-Midnight-2024-top.jpg.webp",
    ],
    ratings: [],
  },
  {
    title: "Apple iPad Pro 11-inch M4",
    slug: "apple-ipad-pro-11-m4-2024",
    description:
      "iPad Pro 11-inch with breakthrough M4 chip, Ultra Retina XDR display, and incredibly thin design. Perfect for creative professionals with Apple Pencil Pro support and advanced cameras.",
    price: 999,
    category: "Tablets",
    brand: "Apple",
    quantity: 10,
    sold: 0,
    color: "Space Black",
    images: [
      "https://www.amac.nl/media/catalog/product/cache/bdb76e76fe196e56ccc3f4a6ef8ec862/i/p/ipad_pro_11_m4_wifi_space_black_pdp_image_position_1b__wwen_1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-ipad-pro-11-2024-2.jpg",
    ],
    ratings: [],
  },
  {
    title: "Google Pixel 9 Pro",
    slug: "google-pixel-9-pro",
    description:
      "Pixel 9 Pro with Google Tensor G4, 6.3-inch LTPO OLED display, 50MP triple camera system, and 7 years of updates. Experience the best of Google AI with Magic Editor and Best Take.",
    price: 999,
    category: "Smartphones",
    brand: "Google",
    quantity: 10,
    sold: 0,
    color: "Obsidian",
    images: [
      "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-3.jpg",
    ],
    ratings: [],
  },
  {
    title: "Sony WH-1000XM5",
    slug: "sony-wh-1000xm5",
    description:
      "Industry-leading noise canceling wireless headphones with 8 microphones, 30-hour battery life, and exceptional sound quality. Features Auto NC Optimizer and multipoint connection.",
    price: 399,
    category: "Headphones",
    brand: "Sony",
    quantity: 10,
    sold: 0,
    color: "Black",
    images: [
      "https://www.sony.nl/commerceapi/medias/UK-100280-117-SNY-WH1000XM5-Pink-Features-NL.jpg?context=bWFzdGVyfHJvb3R8NTgwMDU5fGltYWdlL2pwZWd8YUdabEwyZzBaUzg1TmpZMk9URXdOVGcwT0RZeUwxVkxMVEV3TURJNE1DMHhNVGRmVTA1WlgxZElNVEF3TUZoTk5WOVFhVzVyWDBabFlYUjFjbVZ6WDA1TUxtcHdad3w0YmEzNDgwYTI1YzJhMGYyN2M2ZWE3N2JhMWZiNzcyNzAxYWQzYmZlNDM5OTAwNzY4MmU4NTljNjhkYjc5YTAw",
      "https://www.sony.nl/commerceapi/medias/Dutch-Battery-Life-Pink-WH-1000XM5-30-uur-batterijduur-Infographics.jpeg?context=bWFzdGVyfHJvb3R8MjU5Njk3fGltYWdlL2pwZWd8YURSaEwyZ3dZeTg1TmpZMk9URXhNVEE1TVRVd0wwUjFkR05vWDBKaGRIUmxjbmt0VEdsbVpWOVFhVzVyWDFkSUxURXdNREJZVFRWZk16QWdkWFZ5SUdKaGRIUmxjbWxxWkhWMWNsOUpibVp2WjNKaGNHaHBZM011YW5CbFp3fDVlOGY1YjM0MjVkYzJkZjVlZDZjMTJmYmE2NTZlZDNkYzBmY2M3ZWQxMTdiMDAzZDI4MTY2MTk1Yjc3ZWE1M2Q",
      "https://www.sony.nl/commerceapi/medias/UK-100280-161-SNY-WH1000XM5-Pink-Tech-NL.jpg?context=bWFzdGVyfHJvb3R8MzM3OTUyfGltYWdlL2pwZWd8YUdSaUwyZ3hNeTg1TmpZMk9URXhNemN4TWprMEwxVkxMVEV3TURJNE1DMHhOakZmVTA1WlgxZElNVEF3TUZoTk5TQlFhVzVySUZSbFkyaGZUa3d1YW5CbnwxNGMwZjZiOWUwYWM0NmUwN2MxYTQzZTExYjAyNzBmMjI2ZjdkMTFmMzlmNGViMmE2OWUzZDI5YjUxOThmYjM3",
      "https://www.sony.nl/commerceapi/medias/UK-100280-132-SNY-Whats-in-the-box-Pink-NL.jpg?context=bWFzdGVyfHJvb3R8NTI5Mjg3fGltYWdlL2pwZWd8YUdJekwyZzNPUzg1TmpZMk9URXlNakl6TWpZeUwxVkxMVEV3TURJNE1DMHhNekpmVTA1WlgxZG9ZWFJ6WDJsdVgzUm9aVjlpYjNoZlVHbHVhMTlPVEM1cWNHY3wzMDY1ODI1NzQ0ZGFjNDI5MGI1NTViMjViYzg1ZTA2MzZlZmQ2ZjRhYjIxODg5OWZlZGYzMmNiOGUxODMzYjRh",
    ],
    ratings: [],
  },
  {
    title: "Samsung Galaxy Watch 7",
    slug: "samsung-galaxy-watch-7",
    description:
      "Galaxy Watch 7 with advanced health monitoring, BioActive sensor, sleep tracking, and AI-powered insights. 40mm case with vibrant AMOLED display and up to 30 hours battery life.",
    price: 299,
    category: "Smartwatches",
    brand: "Samsung",
    quantity: 10,
    sold: 0,
    color: "Green",
    images: [
      "https://images.samsung.com/is/image/samsung/p6pim/global/wearable/2407/global-wearable-W7_40mm_Green_SportBand_S_M_Green_Right-542544481?$640_640_JPG$",
      "https://images.samsung.com/is/image/samsung/p6pim/global/wearable/2407/global-wearable-W7_40mm_Green_SportBand_S_M_Green_Front-542544480?$640_640_JPG$",
    ],
    ratings: [],
  },
  {
    title: "Apple AirPods Pro 2 (USB-C)",
    slug: "apple-airpods-pro-2-usbc",
    description:
      "AirPods Pro 2nd generation with USB-C charging, up to 2x more Active Noise Cancellation, Adaptive Audio, and Personalized Spatial Audio. Includes MagSafe charging case with speaker.",
    price: 249,
    category: "Earbuds",
    brand: "Apple",
    quantity: 10,
    sold: 0,
    color: "White",
    images: [
      "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83",
      "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83_AV1",
    ],
    ratings: [],
  },
  {
    title: "Bose QuietComfort Ultra Headphones",
    slug: "bose-quietcomfort-ultra-headphones",
    description:
      "Premium wireless headphones with world-class noise cancellation, Bose Immersive Audio, CustomTune technology, and up to 24 hours battery life. Ultimate comfort for all-day listening.",
    price: 429,
    category: "Headphones",
    brand: "Bose",
    quantity: 10,
    sold: 0,
    color: "Black",
    images: [
      "https://assets.bose.com/content/dam/cloudassets/Bose_DAM/Web/consumer_electronics/global/products/headphones/QCUH-HEADPHONEARN/product_silo_images/QCUH24-Black_AEM_ECOMM_GALLERY_01.png/jcr:content/renditions/cq5dam.web.600.600.png",
      "https://assets.bose.com/content/dam/cloudassets/Bose_DAM/Web/consumer_electronics/global/products/headphones/QCUH-HEADPHONEARN/product_silo_images/AEM_PDP_GALLERY_BLACK-2.png/jcr:content/renditions/cq5dam.web.600.600.png",
      "https://assets.bose.com/content/dam/cloudassets/Bose_DAM/Web/consumer_electronics/global/products/headphones/QCUH-HEADPHONEARN/product_silo_images/AEM_PDP_GALLERY_BLACK-6.png/jcr:content/renditions/cq5dam.web.600.600.png",
      "https://assets.bose.com/content/dam/cloudassets/Bose_DAM/Web/consumer_electronics/global/products/headphones/QCUH-HEADPHONEARN/product_silo_images/AEM_PDP_GALLERY_BLACK-8.png/jcr:content/renditions/cq5dam.web.600.600.png",
    ],
    ratings: [],
  },
  {
    title: "Dell XPS 14 (2024)",
    slug: "dell-xps-14-2024",
    description:
      "Dell XPS 14 laptop with Intel Core Ultra 7 processor, 14.5-inch 3.2K OLED touch display, NVIDIA GeForce RTX 4050, 32GB RAM, 1TB SSD. Premium aluminum design with Copilot+ PC capabilities.",
    price: 1999,
    category: "Laptops",
    brand: "Dell",
    quantity: 10,
    sold: 0,
    color: "Platinum Silver",
    images: [
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/14-9440/media-gallery/notebook-xps-14-9440t-sl-gallery-9.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=639&qlt=100,1&resMode=sharp2&size=639,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/14-9440/media-gallery/notebook-xps-14-9440t-sl-gallery-5.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=675&qlt=100,1&resMode=sharp2&size=675,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/14-9440/media-gallery/notebook-xps-14-9440nt-sl-gallery-4.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=677&qlt=100,1&resMode=sharp2&size=677,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/14-9440/media-gallery/notebook-xps-14-9440nt-sl-gallery-2.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=507&qlt=100,1&resMode=sharp2&size=507,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/14-9440/media-gallery/notebook-xps-14-9440-sl-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&wid=5000&hei=5000&qlt=100,1&resMode=sharp2&size=5000,5000&chrss=full&imwidth=5000",
    ],
    ratings: [],
  },
  {
    title: "Apple iPhone 17 Pro",
    slug: "apple-iphone-17-pro",
    description:
      "The iPhone 17 Pro features a stunning 6.3-inch Super Retina XDR display, A19 Pro chip, advanced camera system with 48MP main sensor, and titanium design. Experience next-level performance with Apple Intelligence capabilities.",
    price: 1199,
    category: "Smartphones",
    brand: "Apple",
    quantity: 15,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-pro-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-pro-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-pro-3.jpg",
    ],
    color: "Natural Titanium",
    ratings: [],
  },
  {
    title: "Apple iPhone 17 Pro Max",
    slug: "apple-iphone-17-pro-max",
    description:
      "The iPhone 17 Pro Max boasts a massive 6.9-inch Super Retina XDR display, A19 Pro chip, pro camera system with 48MP Fusion camera, and all-day battery life. The ultimate iPhone experience.",
    price: 1399,
    category: "Smartphones",
    brand: "Apple",
    quantity: 12,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-pro-max-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-pro-max-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-pro-max-3.jpg",
    ],
    color: "Deep Blue",
    ratings: [],
  },
  {
    title: "Apple iPhone 17 Air",
    slug: "apple-iphone-17-air",
    description:
      "The iPhone 17 Air introduces a breakthrough thin design with a 6.5-inch display, A19 Pro chip, 48MP Fusion camera, and Center Stage front camera. Power meets elegance.",
    price: 1099,
    category: "Smartphones",
    brand: "Apple",
    quantity: 18,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-air-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-air-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-17-air-3.jpg",
    ],
    color: "Silver",
    ratings: [],
  },
  {
    title: "Apple iPhone 16 Pro Max",
    slug: "apple-iphone-16-pro-max",
    description:
      "The iPhone 16 Pro Max features a 6.9-inch Super Retina XDR display, A18 Pro chip, 48MP camera system with 5x telephoto, and titanium design. Professional photography in your pocket.",
    price: 1199,
    category: "Smartphones",
    brand: "Apple",
    quantity: 20,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-16-pro-max-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-16-pro-max-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-16-pro-max-3.jpg",
    ],
    color: "Desert Titanium",
    ratings: [],
  },
  {
    title: "Samsung Galaxy S26 Ultra",
    slug: "samsung-galaxy-s26-ultra",
    description:
      "The Galaxy S26 Ultra features a 6.9-inch display, 200MP camera system, Snapdragon 8 Elite Gen 5 processor, S Pen integration, and 5000mAh battery. The ultimate productivity powerhouse.",
    price: 1399,
    category: "Smartphones",
    brand: "Samsung",
    quantity: 14,
    sold: 0,
    images: [
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s948uzkaxaa/gallery/us-galaxy-s26-ultra-sm-s948-sm-s948uzkaxaa-555734567",
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s948uzkaxaa/gallery/us-galaxy-s26-ultra-sm-s948-sm-s948uzkaxaa-555734568",
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s948uzkaxaa/gallery/us-galaxy-s26-ultra-sm-s948-sm-s948uzkaxaa-555734569",
    ],
    color: "Titanium Black",
    ratings: [],
  },
  {
    title: "Samsung Galaxy S26+",
    slug: "samsung-galaxy-s26-plus",
    description:
      "The Galaxy S26+ features a 6.7-inch display, 50MP camera system, customized Snapdragon 8 Elite Gen 5 processor, and 4900mAh battery. Premium performance in a sleek design.",
    price: 1099,
    category: "Smartphones",
    brand: "Samsung",
    quantity: 16,
    sold: 0,
    images: [
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s947uzkaxaa/gallery/us-galaxy-s26-plus-sm-s947-sm-s947uzkaxaa-555734570",
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s947uzkaxaa/gallery/us-galaxy-s26-plus-sm-s947-sm-s947uzkaxaa-555734571",
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s947uzkaxaa/gallery/us-galaxy-s26-plus-sm-s947-sm-s947uzkaxaa-555734572",
    ],
    color: "Cobalt Violet",
    ratings: [],
  },
  {
    title: "Samsung Galaxy S26",
    slug: "samsung-galaxy-s26",
    description:
      "The Galaxy S26 features a 6.3-inch display, 50MP camera system, customized processor, and 4300mAh battery. Compact power with advanced Galaxy AI features.",
    price: 899,
    category: "Smartphones",
    brand: "Samsung",
    quantity: 22,
    sold: 0,
    images: [
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s941uzkaxaa/gallery/us-galaxy-s26-sm-s941-sm-s941uzkaxaa-555734573",
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s941uzkaxaa/gallery/us-galaxy-s26-sm-s941-sm-s941uzkaxaa-555734574",
      "https://images.samsung.com/is/image/samsung/p6pim/us/sm-s941uzkaxaa/gallery/us-galaxy-s26-sm-s941-sm-s941uzkaxaa-555734575",
    ],
    color: "Sky Blue",
    ratings: [],
  },
  {
    title: "Samsung Galaxy S25 Ultra",
    slug: "samsung-galaxy-s25-ultra",
    description:
      "The Galaxy S25 Ultra features a 6.9-inch display, 200MP camera, Snapdragon 8 Elite processor, S Pen, and advanced AI capabilities. The pinnacle of mobile innovation.",
    price: 1299,
    category: "Smartphones",
    brand: "Samsung",
    quantity: 18,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s25-ultra-5g-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s25-ultra-5g-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s25-ultra-5g-3.jpg",
    ],
    color: "Titanium Gray",
    ratings: [],
  },
  {
    title: "Google Pixel 10 Pro",
    slug: "google-pixel-10-pro",
    description:
      "The Pixel 10 Pro features a 6.3-inch LTPO OLED display, Google Tensor G5 chip, 50MP camera with 5x telephoto, and advanced AI features. Pure Google experience with cutting-edge technology.",
    price: 999,
    category: "Smartphones",
    brand: "Google",
    quantity: 15,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-10-pro-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-10-pro-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-10-pro-3.jpg",
    ],
    color: "Obsidian",
    ratings: [],
  },
  {
    title: "OnePlus 13",
    slug: "oneplus-13",
    description:
      "The OnePlus 13 features a 6.82-inch 2K display, Snapdragon 8 Elite processor, 50MP Hasselblad camera system, and 6000mAh battery with 100W charging. Never Settle.",
    price: 899,
    category: "Smartphones",
    brand: "OnePlus",
    quantity: 17,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-13-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-13-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-13-3.jpg",
    ],
    color: "Black Eclipse",
    ratings: [],
  },
  {
    title: "OnePlus 12",
    slug: "oneplus-12",
    description:
      "The OnePlus 12 features a 6.82-inch 2K AMOLED display, Snapdragon 8 Gen 3, 50MP Hasselblad camera, and 5400mAh battery. Flagship performance at its best.",
    price: 799,
    category: "Smartphones",
    brand: "OnePlus",
    quantity: 19,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-12-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-12-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-12-3.jpg",
    ],
    color: "Flowy Emerald",
    ratings: [],
  },
  {
    title: "Xiaomi 15 Ultra",
    slug: "xiaomi-15-ultra",
    description:
      "The Xiaomi 15 Ultra features a 6.73-inch 2K display, Snapdragon 8 Elite, Leica quad camera system with 200MP main sensor, and 5410mAh battery. Professional photography redefined.",
    price: 1199,
    category: "Smartphones",
    brand: "Xiaomi",
    quantity: 13,
    sold: 0,
    images: [    "https://i02.appmifile.com/mi-com-product/fly-birds/xiaomi-15-ultra/pc/telephoto.jpg?f=webp",
    "https://i02.appmifile.com/mi-com-product/fly-birds/xiaomi-15-ultra/pc/6301d3de9eb1617c20fcf5d944f080c7.jpg",
    "https://i02.appmifile.com/mi-com-product/fly-birds/xiaomi-15-ultra/pc/allaround2.jpg?f=webp",
    "https://i02.appmifile.com/mi-com-product/fly-birds/xiaomi-15-ultra/pc/camerinspired.jpg?f=webp"
    ],
    color: "Black",
    ratings: [],
  },
  {
    title: "Xiaomi 14 Ultra",
    slug: "xiaomi-14-ultra",
    description:
      "The Xiaomi 14 Ultra features a 6.73-inch AMOLED display, Snapdragon 8 Gen 3, Leica quad camera system, and 5000mAh battery. Photography excellence meets performance.",
    price: 999,
    category: "Smartphones",
    brand: "Xiaomi",
    quantity: 16,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-14-ultra-1.jpg",
      "https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-14-ultra-2.jpg",
      "https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-14-ultra-3.jpg",
    ],
    color: "Titanium Gray",
    ratings: [],
  },
  {
    title: "OPPO Find X8 Pro",
    slug: "oppo-find-x8-pro",
    description:
      "The OPPO Find X8 Pro features a 6.78-inch AMOLED display, Dimensity 9400 processor, Hasselblad camera system with dual telephoto, and 5910mAh battery. Master of photography.",
    price: 1099,
    category: "Smartphones",
    brand: "OPPO",
    quantity: 14,
    sold: 0,
    images: [
      "https://fdn2.gsmarena.com/vv/pics/oppo/oppo-find-x8-pro-3.jpg",
      "https://fdn2.gsmarena.com/vv/pics/oppo/oppo-find-x8-pro-5.jpg",
      "https://fdn2.gsmarena.com/vv/pics/oppo/oppo-find-x8-pro-4.jpg",
    ],
    color: "Starry Black",
    ratings: [],
  },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("🔌 Connected to MongoDB");

    // Clear existing products (optional - comment out if you want to keep existing)
    // await Product.deleteMany({});
    // console.log('🗑️  Cleared existing products');

    // Insert products (skip if slug already exists)
    let created = 0;
    let skipped = 0;

    for (const product of products) {
      const exists = await Product.findOne({ slug: product.slug });
      if (!exists) {
        await Product.create(product);
        console.log(`✅ Created: ${product.title}`);
        created++;
      } else {
        console.log(`⏭️  Already exists: ${product.title}`);
        skipped++;
      }
    }

    console.log(`\n🎉 Seed completed!`);
    console.log(`   Created: ${created} products`);
    console.log(`   Skipped: ${skipped} products`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

seedProducts();
