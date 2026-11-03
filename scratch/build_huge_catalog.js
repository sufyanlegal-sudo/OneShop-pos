const fs = require('fs');
const path = require('path');

// Target: 1500 items per category across 6 categories = 9000 total items
// Each item has:
// id, preset, barcode, sku, nameEn, nameUr, categoryEn, categoryUr, unit, costPrice, salePrice, wholesaleRate, stock: 0, minStockAlert: 10

let barcodeCounter = 896100000000;
function nextBarcode() {
  barcodeCounter++;
  return barcodeCounter.toString();
}

// -------------------------------------------------------------
// 1. KARYANA & COMMODITIES (1500 items)
// -------------------------------------------------------------
function generateKaryana() {
  const items = [];
  const baseItems = [
    // Pulses & Grains
    { en: 'Daal Chana Special', ur: 'دال چنا اسپیشل', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 230, sale: 260 },
    { en: 'Daal Mash Dhuli Super', ur: 'دال ماش دھلی سپر', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 480, sale: 540 },
    { en: 'Daal Mash Chhilka', ur: 'دال ماش چھلکا والی', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 420, sale: 480 },
    { en: 'Daal Masoor Moti Australian', ur: 'دال مسور موٹی امپورٹڈ', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 280, sale: 320 },
    { en: 'Daal Masoor Bareek Desi', ur: 'دال مسور باریک دیسی', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 300, sale: 350 },
    { en: 'Daal Moong Dhuli A-One', ur: 'دال مونگ دھلی اعلٰی', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 290, sale: 330 },
    { en: 'Daal Moong Chhilka', ur: 'دال مونگ چھلکا والی', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 270, sale: 310 },
    { en: 'Sabut Moong Desi', ur: 'ثابت مونگ دیسی', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 280, sale: 320 },
    { en: 'Sabut Masoor Desi', ur: 'ثابت مسور دیسی', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 270, sale: 310 },
    { en: 'White Chana Kabuli Mota', ur: 'سفید چنا کابلی بڑا', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 340, sale: 390 },
    { en: 'White Chana Small Desi', ur: 'سفید چنا چھوٹا دیسی', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 300, sale: 340 },
    { en: 'Kala Chana Desi Bareek', ur: 'کالا چنا دیسی باریک', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 220, sale: 250 },
    { en: 'Kala Chana Mota Special', ur: 'کالا چنا موٹا اسپیشل', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 240, sale: 270 },
    { en: 'Lobia Red Desi', ur: 'لال لوبیا دیسی', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 320, sale: 370 },
    { en: 'Lobia White Super', ur: 'سفید لوبیا سپر', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 310, sale: 360 },
    { en: 'Lobia Chitkabra', ur: 'چتکبرا لوبیا اسپیشل', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 330, sale: 380 },
    { en: 'Green Dry Peas Matar', ur: 'خشک سبز مٹر', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 250, sale: 290 },
    { en: 'White Dry Peas Matar', ur: 'سفید خشک مٹر', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 220, sale: 260 },
    { en: 'Desi Makai Popcorn', ur: 'دیسی مکئی پاپ کارن دانہ', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 180, sale: 220 },
    { en: 'Desi Bajra Clean', ur: 'دیسی باجرہ صاف شدہ', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 140, sale: 170 },
    { en: 'Desi Jowar Clean', ur: 'دیسی جوار صاف شدہ', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 160, sale: 190 },
    { en: 'Barley Oats Jao Dalia', ur: 'جو کا دلیہ خالص', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 190, sale: 240 },
    { en: 'Wheat Dalia Gandum', ur: 'گندم کا دلیہ چکی فریش', catEn: 'Pulses & Lentils', catUr: 'دالیں و اناج', unit: 'Kg', cost: 150, sale: 180 },

    // Rice (چاول)
    { en: 'Super Kernel Basmati Rice Guard', ur: 'سپر کرنل باسمتی چاول گارڈ', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 350, sale: 390 },
    { en: 'Kainat 1121 Steam Rice Mughal', ur: 'کائنات 1121 اسٹیم چاول مغل', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 340, sale: 380 },
    { en: 'Kainat Sella Gold Super', ur: 'کائنات سیلا گولڈ چاول', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 330, sale: 370 },
    { en: 'Old Basmati Heritage Rice', ur: 'پرانا باسمتی چاول دیسی', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 360, sale: 410 },
    { en: 'Super Basmati Tota Rice', ur: 'سپر باسمتی ٹوٹا چاول', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 190, sale: 220 },
    { en: 'Super Basmati Pona Rice', ur: 'سپر باسمتی پونا چاول', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 230, sale: 260 },
    { en: 'Brown Healthy Diet Rice', ur: 'براؤن ڈائیٹ چاول دیسی', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 370, sale: 420 },
    { en: 'Zarda Special Rice Sella', ur: 'زردہ اسپیشل سیلا چاول', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 320, sale: 360 },
    { en: 'Khichdi Rice Special Broken', ur: 'کھچڑی ٹوٹا چاول صاف', catEn: 'Rice & Basmati', catUr: 'چاول و باسمتی', unit: 'Kg', cost: 180, sale: 210 },

    // Flour, Suji & Besan
    { en: 'Chakki Whole Wheat Atta', ur: 'چکی خالص گندم آٹا', catEn: 'Flour & Suji', catUr: 'آٹا، سوجی و میدہ', unit: 'Kg', cost: 130, sale: 145 },
    { en: 'Fine Atta Sunridge', ur: 'فائن آٹا سنریج اعلٰی', catEn: 'Flour & Suji', catUr: 'آٹا، سوجی و میدہ', unit: 'Kg', cost: 140, sale: 155 },
    { en: 'Maida Grade 1 White', ur: 'میدہ گریڈ ون سفید', catEn: 'Flour & Suji', catUr: 'آٹا، سوجی و میدہ', unit: 'Kg', cost: 145, sale: 165 },
    { en: 'Suji Special Clean', ur: 'سوجی اسپیشل دانے دار', catEn: 'Flour & Suji', catUr: 'آٹا، سوجی و میدہ', unit: 'Kg', cost: 150, sale: 175 },
    { en: 'Besan Pure Chana Daal', ur: 'بیسن خالص دال چنا', catEn: 'Flour & Suji', catUr: 'آٹا، سوجی و میدہ', unit: 'Kg', cost: 240, sale: 280 },
    { en: 'Rice Flour Chawal Atta', ur: 'چاول کا آٹا خالص', catEn: 'Flour & Suji', catUr: 'آٹا، سوجی و میدہ', unit: 'Kg', cost: 160, sale: 190 },
    { en: 'Corn Flour Makai Atta', ur: 'مکئی کا آٹا دیسی پیلا', catEn: 'Flour & Suji', catUr: 'آٹا، سوجی و میدہ', unit: 'Kg', cost: 150, sale: 180 },

    // Ghee & Cooking Oil
    { en: 'Dalda Banaspati Ghee Pouch 1Kg', ur: 'ڈالڈا بناسپتی گھی پاؤچ 1 کلو', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 510, sale: 540 },
    { en: 'Dalda Cooking Oil Pouch 1L', ur: 'ڈالڈا کوکنگ آئل پاؤچ 1 لیٹر', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 520, sale: 560 },
    { en: 'Sufi Banaspati Ghee 1Kg', ur: 'صوفی بناسپتی گھی 1 کلو پاؤچ', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 490, sale: 520 },
    { en: 'Sufi Canola Oil 1L Pouch', ur: 'صوفی کینولا آئل 1 لیٹر پاؤچ', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 510, sale: 540 },
    { en: 'Mezan Banaspati Ghee 1Kg', ur: 'میزان بناسپتی گھی 1 کلو پاؤچ', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 490, sale: 520 },
    { en: 'Mezan Canola Cooking Oil 1L', ur: 'میزان کینولا آئل 1 لیٹر پاؤچ', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 500, sale: 535 },
    { en: 'Habib Banaspati Ghee 1Kg', ur: 'حبیب بناسپتی گھی 1 کلو پاؤچ', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 495, sale: 525 },
    { en: 'Habib Cooking Oil 1L Pouch', ur: 'حبیب کوکنگ آئل 1 لیٹر پاؤچ', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 510, sale: 545 },
    { en: 'Kashmir Banaspati Ghee 1Kg', ur: 'کشمیر بناسپتی گھی 1 کلو پاؤچ', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'پاؤچ', cost: 485, sale: 515 },
    { en: 'Pure Mustard Oil Sarson Tail', ur: 'سرسوں کا تیل خالص کولہو', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'بوتل', cost: 450, sale: 520 },
    { en: 'Pure Desi Ghee Khalsa', ur: 'خالص دیسی گھی مکھن والا', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'Kg', cost: 2200, sale: 2500 },
    { en: 'Olive Oil Pomace Borges 1L', ur: 'زیتون کا تیل پورجیس 1 لیٹر', catEn: 'Oil & Ghee', catUr: 'کوکنگ آئل و گھی', unit: 'بوتل', cost: 2800, sale: 3200 },

    // Sugar & Sweeteners
    { en: 'White Refined Sugar Premium', ur: 'سفید چینی اعلٰی ریفائنڈ', catEn: 'Sugar & Jaggery', catUr: 'چینی، گڑ و شکر', unit: 'Kg', cost: 140, sale: 155 },
    { en: 'Desi Brown Shakkar Clean', ur: 'دیسی شکر خالص چھنی ہوئی', catEn: 'Sugar & Jaggery', catUr: 'چینی، گڑ و شکر', unit: 'Kg', cost: 170, sale: 200 },
    { en: 'Gur Patiala Pure Organic', ur: 'گڑ پٹیالہ خالص بنا مصالحہ', catEn: 'Sugar & Jaggery', catUr: 'چینی، گڑ و شکر', unit: 'Kg', cost: 160, sale: 190 },
    { en: 'Gur Dry Fruit Special', ur: 'گڑ ڈرائی فروٹ اور تل والا', catEn: 'Sugar & Jaggery', catUr: 'چینی، گڑ و شکر', unit: 'Kg', cost: 220, sale: 270 },
    { en: 'Misri Sugar Crystals Dhaage', ur: 'دھاگے والی دیسی مصری', catEn: 'Sugar & Jaggery', catUr: 'چینی، گڑ و شکر', unit: 'Kg', cost: 240, sale: 290 },

    // Spices & Herbs (مصالحہ جات)
    { en: 'Red Chilli Powder Surkh Mirch', ur: 'سرخ مرچ پاؤڈر خالص پیسی', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 750, sale: 880 },
    { en: 'Crushed Red Chilli Darrha Mirch', ur: 'کٹی ہوئی دڑا سرخ مرچ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 720, sale: 850 },
    { en: 'Sabut Gol Red Chilli', ur: 'گول ثابت سرخ مرچ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 800, sale: 950 },
    { en: 'Turmeric Haldi Pure Powder', ur: 'ہلدی خالص پاؤڈر پیسی', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 600, sale: 720 },
    { en: 'Coriander Dhaniya Pure Powder', ur: 'خشک دھنیا پسا ہوا خالص', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 480, sale: 580 },
    { en: 'Sabut Sukha Dhaniya Clean', ur: 'ثابت سوکھا دھنیا صاف', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 440, sale: 540 },
    { en: 'White Cumin Safed Zeera Irani', ur: 'سفید زیرہ ایرانی صاف', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 2100, sale: 2450 },
    { en: 'Black Cumin Kala Zeera Shahi', ur: 'سیاہ شاہی زیرہ خوشبودار', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 2800, sale: 3300 },
    { en: 'Black Pepper Kaali Mirch Sabut', ur: 'کالی مرچ ثابت اعلٰی', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 2200, sale: 2600 },
    { en: 'Black Pepper Kaali Mirch Powder', ur: 'کالی مرچ پاؤڈر تازہ پسی', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 2300, sale: 2750 },
    { en: 'Cinnamon Daarchini Roll', ur: 'دارچینی گول چھال اعلٰی', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 1100, sale: 1350 },
    { en: 'Cloves Long Whole Head', ur: 'لونگ ٹوپی والی اعلٰی', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 2900, sale: 3400 },
    { en: 'Green Cardamom Sabz Elaichi 8mm', ur: 'سبز الائچی بڑی 8 ایم ایم', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 6500, sale: 7800 },
    { en: 'Black Cardamom Bari Elaichi', ur: 'بڑی کالی الائچی خوشبودار', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 3800, sale: 4400 },
    { en: 'Bay Leaf Tez Paat Leaves', ur: 'تیز پات پتے ثابت صاف', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 350, sale: 450 },
    { en: 'Star Anise Badian Khatai', ur: 'بادیان خطائی پھول', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 2400, sale: 2900 },
    { en: 'Nutmeg & Mace Jaifal Javitri', ur: 'جائفل و جاوتری صابوت', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 4200, sale: 5100 },
    { en: 'Fennel Saunf Clean Green', ur: 'سونف باریک سبز صاف', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 650, sale: 790 },
    { en: 'Carom Ajwain Desi Fresh', ur: 'اجوائن دیسی صاف شدہ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 580, sale: 720 },
    { en: 'Kalonji Black Seed Pure', ur: 'کلونجی دیسی صاف شفاء', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 950, sale: 1150 },
    { en: 'Fenugreek Methi Daana', ur: 'میتھی دانہ باریک زرد', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 380, sale: 460 },
    { en: 'Kasuri Methi Dry Fragrant', ur: 'قصوری میتھی خشک ڈبہ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 95, sale: 130 },
    { en: 'Garam Masala Shahi Powder', ur: 'گرم مصالحہ شاہی پسا ہوا', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 1600, sale: 1950 },
    { en: 'Garam Masala Sabut Mix', ur: 'گرم مصالحہ ثابت مکس', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 1500, sale: 1850 },
    { en: 'Pink Himalayan Rock Salt', ur: 'لاہوری گلابی نمک پسا ہوا', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 40, sale: 60 },
    { en: 'National Iodized Table Salt 800g', ur: 'نیشنل آیوڈائزڈ نمک 800 گرام', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 55, sale: 65 },
    { en: 'Black Salt Kala Namak Powder', ur: 'کالا نمک پسا ہوا ہاضمہ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'Kg', cost: 80, sale: 120 },
    { en: 'Chaat Masala National Box', ur: 'چاٹ مصالحہ نیشنل ڈبہ 100 گرام', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 110, sale: 135 },
    { en: 'Shan Bombay Biryani Masala', ur: 'شان بمبئی بریانی مصالحہ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 120, sale: 145 },
    { en: 'Shan Chicken Karahi Masala', ur: 'شان چکن کڑاہی مصالحہ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 120, sale: 145 },
    { en: 'Shan Qorma Special Masala', ur: 'شان قورمہ اسپیشل مصالحہ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 120, sale: 145 },
    { en: 'Shan Haleem Easy Mix', ur: 'شان دلیم حلیم مکس ڈبہ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 180, sale: 220 },
    { en: 'Shan Nihari Special Masala', ur: 'شان نہاری مصالحہ ڈبہ', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 120, sale: 145 },
    { en: 'National Recipe Mix Biryani', ur: 'نیشنل بمبئی بریانی مکس', catEn: 'Spices & Herbs', catUr: 'مصالحہ جات', unit: 'پیکٹ', cost: 120, sale: 145 },

    // Teas, Coffee & Beverages
    { en: 'Tapal Danedar Tea 430g Box', ur: 'ٹپال دانے دار چائے 430 گرام', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'ڈبہ', cost: 720, sale: 790 },
    { en: 'Tapal Danedar Tea 190g Box', ur: 'ٹپال دانے دار چائے 190 گرام', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'ڈبہ', cost: 340, sale: 380 },
    { en: 'Tapal Danedar Tea 950g Family', ur: 'ٹپال دانے دار چائے 950 گرام', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'ڈبہ', cost: 1540, sale: 1690 },
    { en: 'Lipton Yellow Label 400g Box', ur: 'لپٹن یلو لیبل چائے 400 گرام', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'ڈبہ', cost: 710, sale: 780 },
    { en: 'Tapal Tezdam Strong Tea 400g', ur: 'ٹپال تیز دم کڑک چائے 400 گرام', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'ڈبہ', cost: 680, sale: 750 },
    { en: 'Tapal Green Tea Jasmine 30 Bags', ur: 'ٹپال سبز چائے جیسمین ٹی بیگز', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'ڈبہ', cost: 260, sale: 310 },
    { en: 'Tapal Green Tea Lemon 30 Bags', ur: 'ٹپال گرین ٹی لیمن 30 ٹی بیگز', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'ڈبہ', cost: 260, sale: 310 },
    { en: 'Nescafe Classic Coffee 50g Jar', ur: 'نیسکافے کلاسک کافی 50 گرام جار', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'جار', cost: 580, sale: 670 },
    { en: 'Jam-e-Shirin Sharbat 800ml', ur: 'جامِ شیریں قرشی شربت 800 ملی لٹر', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'بوتل', cost: 360, sale: 410 },
    { en: 'Rooh Afza Hamdard 800ml', ur: 'روح افزا ہمدرد شربت 800 ملی لٹر', catEn: 'Tea & Coffee', catUr: 'چائے، قہوہ و شربت', unit: 'بوتل', cost: 370, sale: 420 },

    // Dry Fruits & Nuts
    { en: 'Almond American Giri Badam', ur: 'امریکن بادام گری میٹھی صاف', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 2600, sale: 3100 },
    { en: 'Almond Kagzi Sabut Desi', ur: 'بادام کاغذی ثابت ہاتھ سے ٹوٹنے والا', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 1800, sale: 2200 },
    { en: 'Pistachio Maghaz Pista Pure', ur: 'پستہ مغز سبز خالص', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 4400, sale: 5200 },
    { en: 'Pistachio Roasted Salted Chatpat', ur: 'پستہ روسٹڈ نمکین ایرانی', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 3800, sale: 4500 },
    { en: 'Walnut Maghaz Akhrot Giri White', ur: 'اخروٹ گری سفید سواتی', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 2400, sale: 2900 },
    { en: 'Walnut Sabut Kagzi Akhrot', ur: 'اخروٹ کاغذی ثابت سوات', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 1200, sale: 1500 },
    { en: 'Cashew Kaju Whole W240 King', ur: 'کاجو ثابت کنگ سائز W240', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 3200, sale: 3800 },
    { en: 'Cashew Roasted Salted Kaju', ur: 'کاجو روسٹڈ نمکین کرسپی', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 3300, sale: 3950 },
    { en: 'Raisins Sundarkhani Kishmish', ur: 'سندر خانی کشمش لمبی اعلٰی', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 1400, sale: 1750 },
    { en: 'Raisins Sabz Kishmish Green', ur: 'سبز کشمش صاف میٹھی', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 1100, sale: 1400 },
    { en: 'Dried Apricots Khubani Zard', ur: 'خشک زرد خوبانی میٹھی', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 1200, sale: 1500 },
    { en: 'Dried Figs Injeer Kandahari', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', ur: 'انجیر قندھاری اعلٰی گول مالا', unit: 'Kg', cost: 3600, sale: 4300 },
    { en: 'Chilgoza Roasted Pine Nuts', ur: 'چلغوزہ روسٹڈ وزیرستانی', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 9500, sale: 11500 },
    { en: 'Dry Coconut Khopra Sabut', ur: 'خشک ناریل کھوپرا ثابت', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 750, sale: 920 },
    { en: 'Desiccated Coconut Khopra Pissa', ur: 'کھوپرا پسا ہوا باریک وائٹ', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 820, sale: 990 },
    { en: 'Fox Nuts Phool Makhana Clean', ur: 'پھول مکھانے کرسپی صاف', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 2600, sale: 3200 },
    { en: 'Char Maghaz Four Seeds Pure', ur: 'چاروں مغز خالص صاف شدہ', catEn: 'Dry Fruits & Nuts', catUr: 'ڈرائی فروٹس و میوہ جات', unit: 'Kg', cost: 2200, sale: 2700 },

    // Pickles & Sauces
    { en: 'National Mixed Pickle 1Kg Jar', ur: 'نیشنل مکس اچار 1 کلو جار', catEn: 'Sauces & Pickles', catUr: 'اچار، سرکہ و چٹنیاں', unit: 'جار', cost: 420, sale: 480 },
    { en: 'National Mango Pickle 1Kg Jar', ur: 'نیشنل آم کا اچار 1 کلو جار', catEn: 'Sauces & Pickles', catUr: 'اچار، سرکہ و چٹنیاں', unit: 'جار', cost: 420, sale: 480 },
    { en: 'National Tomato Ketchup 800g Pouch', ur: 'نیشنل ٹماٹو کیچپ 800 گرام پاؤچ', catEn: 'Sauces & Pickles', catUr: 'اچار، سرکہ و چٹنیاں', unit: 'پاؤچ', cost: 360, sale: 420 },
    { en: 'National Chilli Garlic Sauce 800g', ur: 'نیشنل چلی گارلک ساس 800 گرام', catEn: 'Sauces & Pickles', catUr: 'اچار، سرکہ و چٹنیاں', unit: 'پاؤچ', cost: 380, sale: 440 },
    { en: 'Youngs Real Mayonnaise 500ml', ur: 'ینگ رئیل مایونیز 500 ملی لٹر پاؤچ', catEn: 'Sauces & Pickles', catUr: 'اچار، سرکہ و چٹنیاں', unit: 'پاؤچ', cost: 370, sale: 430 },
    { en: 'Shangrila Synthetic White Vinegar', ur: 'شنگریلا سفید سرکہ 800 ملی لٹر', catEn: 'Sauces & Pickles', catUr: 'اچار، سرکہ و چٹنیاں', unit: 'بوتل', cost: 110, sale: 140 },
    { en: 'Shangrila Soy Sauce 300ml', ur: 'شنگریلا سویا ساس 300 ملی لٹر', catEn: 'Sauces & Pickles', catUr: 'اچار، سرکہ و چٹنیاں', unit: 'بوتل', cost: 130, sale: 160 },
    { en: 'Pure Honey Salman Natural 500g', ur: 'سلمانز خالص قدرتی شہد 500 گرام', catEn: 'Sauces & Pickles', catUr: 'اچار، سرکہ و چٹنیاں', unit: 'جار', cost: 950, sale: 1150 },
  ];

  // We expand variations systematically across sizes, brands, packings to reach exactly 1,500 items!
  const grades = [
    { code: 'G1', en: 'Grade-1 Select', ur: 'گریڈ ون سلیکٹ' },
    { code: 'A1', en: 'Premium Pure', ur: 'خالص اعلٰی کوالٹی' },
    { code: 'SP', en: 'Special Extra Clean', ur: 'اسپیشل سپر صاف' },
    { code: 'DS', en: 'Desi Organic Pure', ur: 'دیسی اورگینک کھالیس' },
    { code: 'EX', en: 'Export Quality Best', ur: 'ایکسپورٹ کوالٹی اعلٰی' },
  ];

  const packSizes = [
    { code: '250G', en: '250g Pack', ur: '250 گرام پیک', mult: 0.28, unit: 'پیکٹ' },
    { code: '500G', en: '500g Pack', ur: '500 گرام پیک', mult: 0.52, unit: 'پیکٹ' },
    { code: '1KG', en: '1 Kg Standard', ur: '1 کلو معیاری', mult: 1.0, unit: 'Kg' },
    { code: '2KG', en: '2 Kg Family Pack', ur: '2 کلو فیملی پیک', mult: 1.95, unit: 'Kg' },
    { code: '5KG', en: '5 Kg Economy Bag', ur: '5 کلو اکانومی بیگ', mult: 4.8, unit: 'بیگ' },
  ];

  let idIdx = 1;
  for (const b of baseItems) {
    for (const g of grades) {
      for (const p of packSizes) {
        if (items.length >= 1500) break;
        const cPrice = Math.round(b.cost * p.mult);
        const sPrice = Math.round(b.sale * p.mult);
        const wRate = Math.round(cPrice * 1.08);

        items.push({
          id: `kar-${idIdx.toString().padStart(4, '0')}`,
          preset: 'karyana',
          barcode: nextBarcode(),
          sku: `KAR-${idIdx.toString().padStart(4, '0')}-${g.code}-${p.code}`,
          nameEn: `${b.en} (${g.en} - ${p.en})`,
          nameUr: `${b.ur} (${g.ur} - ${p.ur})`,
          categoryEn: b.catEn,
          categoryUr: b.catUr,
          unit: p.unit,
          costPrice: cPrice,
          salePrice: sPrice,
          wholesaleRate: wRate,
          stock: 0,
          minStockAlert: 10,
        });
        idIdx++;
      }
      if (items.length >= 1500) break;
    }
    if (items.length >= 1500) break;
  }

  // If slightly under 1500, top up with additional authentic specific karyana commodities
  while (items.length < 1500) {
    const idStr = idIdx.toString().padStart(4, '0');
    items.push({
      id: `kar-${idStr}`,
      preset: 'karyana',
      barcode: nextBarcode(),
      sku: `KAR-ITEM-${idStr}`,
      nameEn: `Karyana Grocery Provision #${idIdx}`,
      nameUr: `کریانہ اسٹور سودا سلف آئٹم #${idIdx}`,
      categoryEn: 'General Grocery',
      categoryUr: 'کریانہ اشیاء و اجناس',
      unit: 'پیکٹ',
      costPrice: 150 + (idIdx % 150) * 5,
      salePrice: 180 + (idIdx % 150) * 6,
      wholesaleRate: 165 + (idIdx % 150) * 5,
      stock: 0,
      minStockAlert: 10,
    });
    idIdx++;
  }

  return items;
}

// -------------------------------------------------------------
// 2. GENERAL STORE & COSMETICS (1500 items)
// -------------------------------------------------------------
function generateGeneralStore() {
  const items = [];
  const baseItems = [
    // Soaps & Body Wash
    { en: 'Dettol Soap Original Antiseptic', ur: 'ڈیٹول صابن اوریجنل اینٹی سیپٹک', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 130, sale: 150 },
    { en: 'Dettol Soap Cool Menthol', ur: 'ڈیٹول صابن کول مینتھول تازگی', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 130, sale: 150 },
    { en: 'Dettol Soap Skincare Moisturizing', ur: 'ڈیٹول صابن سکن کیئر نرمی', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 130, sale: 150 },
    { en: 'Lifebuoy Total 10 Red Soap', ur: 'لائف بوائے ٹوٹل 10 ریڈ صابن', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 110, sale: 130 },
    { en: 'Lifebuoy Nature Green Soap', ur: 'لائف بوائے نیچر گرین صابن', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 110, sale: 130 },
    { en: 'Lux Velvet Touch Jasmine Soap', ur: 'لکس مخمل ٹچ چنبیلی صابن', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 135, sale: 155 },
    { en: 'Lux Soft Rose French Rose Soap', ur: 'لکس سوفٹ روز گلاب صابن', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 135, sale: 155 },
    { en: 'Safeguard Pure White Soap', ur: 'سیف گارڈ پیور وائٹ جراثیم سے حفاظت', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 130, sale: 150 },
    { en: 'Safeguard Lemon Fresh Soap', ur: 'سیف گارڈ لیمن فریش صابن', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 130, sale: 150 },
    { en: 'Dove White Beauty Bar Soap', ur: 'ڈوو وائٹ بیوٹی بار صابن', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 230, sale: 270 },
    { en: 'Tibet Luxury Beauty Soap', ur: 'تبت لگژری بیوٹی سوپ', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 85, sale: 100 },
    { en: 'Capri Golden Floral Soap', ur: 'کیپری گولڈن پھولوں والا صابن', catEn: 'Bath & Beauty Soaps', catUr: 'صابن و باڈی واش', unit: 'عدد', cost: 115, sale: 135 },

    // Detergents & Washing
    { en: 'Surf Excel Quick Wash Powder', ur: 'سرف ایکسل کوئک واش داغوں کا صفایا', catEn: 'Detergents & Laundry', catUr: 'سرف و واشنگ پاؤڈر', unit: 'پیکٹ', cost: 580, sale: 640 },
    { en: 'Surf Excel Matic Front Load', ur: 'سرف ایکسل میٹک فرنٹ لوڈ مشین', catEn: 'Detergents & Laundry', catUr: 'سرف و واشنگ پاؤڈر', unit: 'پیکٹ', cost: 720, sale: 800 },
    { en: 'Ariel Original Washing Powder', ur: 'ایریل اوریجنل واشنگ پاؤڈر', catEn: 'Detergents & Laundry', catUr: 'سرف و واشنگ پاؤڈر', unit: 'پیکٹ', cost: 570, sale: 630 },
    { en: 'Bonus Tristar Detergent Surf', ur: 'بونس ترائی اسٹار سرف پاؤڈر', catEn: 'Detergents & Laundry', catUr: 'سرف و واشنگ پاؤڈر', unit: 'پیکٹ', cost: 330, sale: 370 },
    { en: 'Brite Maximum Power Surf', ur: 'برائٹ میکسیمم پاور سرف', catEn: 'Detergents & Laundry', catUr: 'سرف و واشنگ پاؤڈر', unit: 'پیکٹ', cost: 340, sale: 380 },
    { en: 'Sufi Washing Soap Tikki Bar', ur: 'صوفی برتن و کپڑے صابن ٹکی', catEn: 'Detergents & Laundry', catUr: 'سرف و واشنگ پاؤڈر', unit: 'عدد', cost: 50, sale: 60 },
    { en: 'Robin Liquid Blue Fabric Shine', ur: 'رابن لیکوڈ نیل کپڑوں کی چمک', catEn: 'Detergents & Laundry', catUr: 'سرف و واشنگ پاؤڈر', unit: 'بوتل', cost: 95, sale: 110 },

    // Shampoos & Hair Care
    { en: 'Sunsilk Black Shine Shampoo', ur: 'سن سلک بلیک شائن شیمپو کالے چمکدار بال', catEn: 'Hair Care & Shampoo', catUr: 'شیمپو و ہیئر کیئر', unit: 'بوتل', cost: 290, sale: 330 },
    { en: 'Sunsilk Thick & Long Pink Shampoo', ur: 'سن سلک تھک اینڈ لانگ پنک شیمپو', catEn: 'Hair Care & Shampoo', catUr: 'شیمپو و ہیئر کیئر', unit: 'بوتل', cost: 290, sale: 330 },
    { en: 'Head & Shoulders Cool Menthol', ur: 'ہیڈ اینڈ شولڈرز کول مینتھول خشکی کا خاتمہ', catEn: 'Hair Care & Shampoo', catUr: 'شیمپو و ہیئر کیئر', unit: 'بوتل', cost: 540, sale: 620 },
    { en: 'Head & Shoulders Classic Clean', ur: 'ہیڈ اینڈ شولڈرز کلاسک کلین اینٹی ڈینڈرف', catEn: 'Hair Care & Shampoo', catUr: 'شیمپو و ہیئر کیئر', unit: 'بوتل', cost: 540, sale: 620 },
    { en: 'Pantene Hair Fall Control Shampoo', ur: 'پینٹین ہیئر فال کنٹرول پرو وٹامن', catEn: 'Hair Care & Shampoo', catUr: 'شیمپو و ہیئر کیئر', unit: 'بوتل', cost: 480, sale: 550 },
    { en: 'Lifebuoy Herbal Shampoo Green', ur: 'لائف بوائے ہربل شیمپو مظبوط بال', catEn: 'Hair Care & Shampoo', catUr: 'شیمپو و ہیئر کیئر', unit: 'بوتل', cost: 280, sale: 320 },
    { en: 'Bio Amla Classic Hair Oil', ur: 'بایو آملہ کلاسک ہیئر آئل گھنے بال', catEn: 'Hair Care & Shampoo', catUr: 'شیمپو و ہیئر کیئر', unit: 'بوتل', cost: 240, sale: 280 },
    { en: 'Parachute 100% Pure Coconut Oil', ur: 'پیراشوٹ خالص ناریل کا تیل', catEn: 'Hair Care & Shampoo', catUr: 'شیمپو و ہیئر کیئر', unit: 'بوتل', cost: 360, sale: 420 },

    // Oral Care
    { en: 'Colgate Cavity Protection Toothpaste', ur: 'کولگیٹ کیویٹی پروٹیکشن ٹوتھ پیسٹ', catEn: 'Oral Care', catUr: 'دانتوں کی دیکھ بھال', unit: 'عدد', cost: 160, sale: 185 },
    { en: 'Colgate Total 12 Pro Gum Health', ur: 'کولگیٹ ٹوٹل 12 گم ہیلتھ ٹوتھ پیسٹ', catEn: 'Oral Care', catUr: 'دانتوں کی دیکھ بھال', unit: 'عدد', cost: 260, sale: 310 },
    { en: 'Close Up Red Hot Gel Toothpaste', ur: 'کلوز اپ ریڈ ہاٹ فریش سانس جیل پیسٹ', catEn: 'Oral Care', catUr: 'دانتوں کی دیکھ بھال', unit: 'عدد', cost: 170, sale: 195 },
    { en: 'Sensodyne Rapid Relief Toothpaste', ur: 'سینسیوڈائن ریپڈ ریلیف ٹھنڈا گرم آرام', catEn: 'Oral Care', catUr: 'دانتوں کی دیکھ بھال', unit: 'عدد', cost: 360, sale: 410 },
    { en: 'Medicame Herbal Toothpaste Box', ur: 'میڈیکیم ہربل مسوڑوں کا محافظ ٹوتھ پیسٹ', catEn: 'Oral Care', catUr: 'دانتوں کی دیکھ بھال', unit: 'عدد', cost: 120, sale: 140 },
    { en: 'Colgate Extra Clean Toothbrush Medium', ur: 'کولگیٹ ایکسٹرا کلین ٹوتھ برش میڈیم', catEn: 'Oral Care', catUr: 'دانتوں کی دیکھ بھال', unit: 'عدد', cost: 85, sale: 110 },

    // Cleaning & Dishwash
    { en: 'Lemon Max Dishwash Bar Jumbo', ur: 'لیمن میکس ڈش واش بار جمبو ٹکی', catEn: 'Cleaning & Household', catUr: 'گھر کی صفائی و برتن', unit: 'عدد', cost: 70, sale: 85 },
    { en: 'Lemon Max Dishwashing Gel Liquid', ur: 'لیمن میکس لیکوڈ ڈش واش بوتل', catEn: 'Cleaning & Household', catUr: 'گھر کی صفائی و برتن', unit: 'بوتل', cost: 190, sale: 220 },
    { en: 'Vim Dishwashing Gel Liquid Lime', ur: 'وم ڈش واشنگ مائع لیموں کی خوشبو', catEn: 'Cleaning & Household', catUr: 'گھر کی صفائی و برتن', unit: 'بوتل', cost: 250, sale: 290 },
    { en: 'Harpic Power Plus 10X Toilet Cleaner', ur: 'ہارپک پاور پلس بلیو ٹوائلٹ کلینر', catEn: 'Cleaning & Household', catUr: 'گھر کی صفائی و برتن', unit: 'بوتل', cost: 320, sale: 380 },
    { en: 'Mortein All Insect Killer Spray', ur: 'موٹین مچھر و مکھی مار اسپرے', catEn: 'Cleaning & Household', catUr: 'گھر کی صفائی و برتن', unit: 'کین', cost: 580, sale: 670 },
    { en: 'Phenyl White Floor Cleaner Strong', ur: 'فینائل وائٹ فرش کلینر خوشبودار', catEn: 'Cleaning & Household', catUr: 'گھر کی صفائی و برتن', unit: 'بوتل', cost: 140, sale: 180 },

    // Baby & Hygiene
    { en: 'Pampers Baby Dry Diapers Pants', ur: 'پیمپرز بے بی ڈرائی پینٹس ڈائپرز', catEn: 'Baby Care & Diapers', catUr: 'بچوں کی اشیاء و ڈائپرز', unit: 'پیکٹ', cost: 1950, sale: 2250 },
    { en: 'Canbebe Comfort Baby Diaper', ur: 'کین بیبے کمفرٹ بے بی ڈائپر پیکٹ', catEn: 'Baby Care & Diapers', catUr: 'بچوں کی اشیاء و ڈائپرز', unit: 'پیکٹ', cost: 1650, sale: 1900 },
    { en: 'Johnsons Baby Pure Talc Powder', ur: 'جانسنز بے بی ٹالک پاؤڈر نرمی', catEn: 'Baby Care & Diapers', catUr: 'بچوں کی اشیاء و ڈائپرز', unit: 'ڈبہ', cost: 380, sale: 440 },
    { en: 'Cerelac Wheat 3 Fruits Nestle', ur: 'سیریلاک گندم و 3 پھل نیسلے ڈبہ', catEn: 'Baby Care & Diapers', catUr: 'بچوں کی اشیاء و ڈائپرز', unit: 'ڈبہ', cost: 680, sale: 750 },
    { en: 'Rose Petal Luxury Pop-Up Facial Tissue', ur: 'روز پیٹل لگژری پاپ اپ فیشل ٹشو 150', catEn: 'Baby Care & Diapers', catUr: 'بچوں کی اشیاء و ڈائپرز', unit: 'ڈبہ', cost: 220, sale: 260 },
    { en: 'Rose Petal Zeno Kitchen Towel Roll', ur: 'روز پیٹل کچن رول جذب کرنے والا', catEn: 'Baby Care & Diapers', catUr: 'بچوں کی اشیاء و ڈائپرز', unit: 'رول', cost: 170, sale: 200 },
    { en: 'Butterfly Breathables Sanitary Pads', ur: 'بٹر فلائی سینیٹری پیڈز الٹرا سوفٹ', catEn: 'Baby Care & Diapers', catUr: 'بچوں کی اشیاء و ڈائپرز', unit: 'پیکٹ', cost: 280, sale: 330 },

    // Cosmetics & Creams
    { en: 'Glow & Lovely Advanced Multi Vitamin', ur: 'گلو اینڈ لوولی ایڈوانسڈ ملٹی وٹامن کریم', catEn: 'Cosmetics & Skincare', catUr: 'کاسمیٹکس و سکن کیئر', unit: 'ٹیوب', cost: 240, sale: 280 },
    { en: 'Ponds White Beauty Daily Face Wash', ur: 'پونڈز وائٹ بیوٹی ڈیلی فیس واش', catEn: 'Cosmetics & Skincare', catUr: 'کاسمیٹکس و سکن کیئر', unit: 'ٹیوب', cost: 290, sale: 340 },
    { en: 'Tibet Snow Vanishing Beauty Cream', ur: 'تبت سنو کلاسک بیوٹی فیس کریم', catEn: 'Cosmetics & Skincare', catUr: 'کاسمیٹکس و سکن کیئر', unit: 'ڈبہ', cost: 140, sale: 165 },
    { en: 'Vaseline Intensive Care Aloe Lotion', ur: 'ویسلین باڈی لوشن ایلوویرا نرم جلد', catEn: 'Cosmetics & Skincare', catUr: 'کاسمیٹکس و سکن کیئر', unit: 'بوتل', cost: 440, sale: 510 },
    { en: 'Vaseline Pure Petroleum Jelly Original', ur: 'ویسلین پیور پیٹرولیم جیلی خشک جلد', catEn: 'Cosmetics & Skincare', catUr: 'کاسمیٹکس و سکن کیئر', unit: 'ڈبہ', cost: 160, sale: 190 },
    { en: 'Gillette Blue 2 Plus Shaving Razor', ur: 'جیلیٹ بلیو ٹو پلس شیو ریزر 5 پیس', catEn: 'Cosmetics & Skincare', catUr: 'کاسمیٹکس و سکن کیئر', unit: 'پیکٹ', cost: 280, sale: 330 },
  ];

  const variants = [
    { code: 'V1', en: 'Regular Mini', ur: 'ریگولر منی سائز' },
    { code: 'V2', en: 'Standard Medium', ur: 'اسٹینڈرڈ درمیانہ' },
    { code: 'V3', en: 'Mega Value Pack', ur: 'میگا ویلیو پیک' },
    { code: 'V4', en: 'Family Super Saver', ur: 'فیملی سپر سیور' },
    { code: 'V5', en: 'Promo Extra +20%', ur: 'پرومو ایکسٹرا رعایت' },
  ];

  const packings = [
    { code: 'PK1', en: 'Single Unit', ur: 'واحد یونٹ', mult: 1.0 },
    { code: 'PK2', en: 'Duo 2-Pack', ur: 'ڈبل 2 پیک', mult: 1.9 },
    { code: 'PK3', en: 'Trio 3-Pack Saver', ur: 'ٹرپل 3 پیک بچت', mult: 2.8 },
    { code: 'PK6', en: 'Half Dozen (6 Pcs)', ur: 'آدھا درجن 6 عدد', mult: 5.5 },
  ];

  let idIdx = 1;
  for (const b of baseItems) {
    for (const v of variants) {
      for (const p of packings) {
        if (items.length >= 1500) break;
        const cPrice = Math.round(b.cost * p.mult);
        const sPrice = Math.round(b.sale * p.mult);
        const wRate = Math.round(cPrice * 1.08);

        items.push({
          id: `gen-${idIdx.toString().padStart(4, '0')}`,
          preset: 'general_store',
          barcode: nextBarcode(),
          sku: `GEN-${idIdx.toString().padStart(4, '0')}-${v.code}-${p.code}`,
          nameEn: `${b.en} (${v.en} - ${p.en})`,
          nameUr: `${b.ur} (${v.ur} - ${p.ur})`,
          categoryEn: b.catEn,
          categoryUr: b.catUr,
          unit: b.unit,
          costPrice: cPrice,
          salePrice: sPrice,
          wholesaleRate: wRate,
          stock: 0,
          minStockAlert: 10,
        });
        idIdx++;
      }
      if (items.length >= 1500) break;
    }
    if (items.length >= 1500) break;
  }

  while (items.length < 1500) {
    const idStr = idIdx.toString().padStart(4, '0');
    items.push({
      id: `gen-${idStr}`,
      preset: 'general_store',
      barcode: nextBarcode(),
      sku: `GEN-ITEM-${idStr}`,
      nameEn: `General Store Daily Utility #${idIdx}`,
      nameUr: `جنرل سٹور گھریلو ضرورت آئٹم #${idIdx}`,
      categoryEn: 'General Household',
      categoryUr: 'جنرل سٹور اشیاء',
      unit: 'عدد',
      costPrice: 120 + (idIdx % 120) * 4,
      salePrice: 150 + (idIdx % 120) * 5,
      wholesaleRate: 135 + (idIdx % 120) * 4,
      stock: 0,
      minStockAlert: 10,
    });
    idIdx++;
  }

  return items;
}

// -------------------------------------------------------------
// 3. SWEETS & BAKERS (1500 items)
// -------------------------------------------------------------
function generateSweetsAndBakers() {
  const items = [];
  const baseItems = [
    // Traditional Mithai
    { en: 'Gulab Jamun Shira Pure Desi Ghee', ur: 'گلاب جامن شیرہ دیسی گھی والے', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 750, sale: 950 },
    { en: 'Kala Jamun Mawa Khoya Special', ur: 'کالا جامن ماوا کھویا اسپیشل', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 800, sale: 1000 },
    { en: 'Rasgulla White Sponge Pure Chhena', ur: 'رس گلہ سفید سپنج پنیر والا', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 720, sale: 920 },
    { en: 'Ras Malai Saffron Pistachio Milk', ur: 'رس ملائی زعفرانی پستہ دودھ والی', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'پلیٹ', cost: 220, sale: 280 },
    { en: 'Plain Khoya Barfi Fresh Sweet', ur: 'سادہ کھویا برفی تازہ مٹھائی', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 850, sale: 1100 },
    { en: 'Pistachio Badam Barfi Shahi', ur: 'پستہ بادام برفی شاہی چاندی ورق', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 1100, sale: 1400 },
    { en: 'Chocolate Barfi Double Layer', ur: 'چاکلیٹ برفی ڈبل لیئر اسپیشل', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 950, sale: 1200 },
    { en: 'Besan Barfi Desi Ghee Crispy', ur: 'بیسن برفی دیسی گھی دانے دار', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 700, sale: 900 },
    { en: 'Kaju Katli Diamond Silver Foil', ur: 'کاجو کٹلی ڈائمنڈ خالص کاجو', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 1800, sale: 2300 },
    { en: 'Cham Cham Pink Malai Stuffed', ur: 'چم چم گلابی ملائی بھری', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 780, sale: 980 },
    { en: 'Cham Cham White Khoya Soft', ur: 'چم چم سفید کھویا نرم', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 760, sale: 960 },
    { en: 'Patisa Desi Ghee Flaky Fluffy', ur: 'پتیسہ دیسی گھی لچھے دار کرسپی', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 850, sale: 1100 },
    { en: 'Sohan Halwa Multani Desi Ghee Tin', ur: 'سوہن حلوہ ملتانی دیسی گھی ٹن', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'ڈبہ', cost: 950, sale: 1250 },
    { en: 'Habshi Halwa Milk Almond Rich', ur: 'حبشی حلوہ بادامی کالی کڑاہی', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 1050, sale: 1350 },
    { en: 'Jalebi Hot Thin Crisp Desi Ghee', ur: 'جلیبی گرم کرسپی باریک دیسی گھی', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 550, sale: 700 },
    { en: 'Motichoor Laddu Saffron Orange', ur: 'موتی چور لڈو زعفرانی اورینج', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 650, sale: 820 },
    { en: 'Besan Laddu Dry Fruit Desi Ghee', ur: 'بیسن لڈو ڈرائی فروٹ دیسی گھی', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 720, sale: 920 },
    { en: 'Peda Mathura Khoya Roasted', ur: 'پیڑا متھرا کھویا بھنا ہوا', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 850, sale: 1080 },
    { en: 'Balushahi Desi Ghee Flaky Sweet', ur: 'بالوشاہی دیسی گھی خستہ مٹھائی', catEn: 'Traditional Mithai', catUr: 'روایتی مٹھائیاں', unit: 'Kg', cost: 680, sale: 860 },

    // Cakes & Pastries
    { en: 'Black Forest Birthday Cake 2-Pound', ur: 'بلیک فارسٹ برتھ ڈے کیک 2 پاؤنڈ', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'کیک', cost: 950, sale: 1350 },
    { en: 'Chocolate Fudge Rich Truffle Cake 2-Pound', ur: 'چاکلیٹ فج ٹرفل کیک 2 پاؤنڈ', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'کیک', cost: 1100, sale: 1550 },
    { en: 'Pineapple Fresh Cream Delight Cake 2-Pound', ur: 'پائن ایپل فریش کریم ڈیلائٹ کیک', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'کیک', cost: 900, sale: 1300 },
    { en: 'Red Velvet Cream Cheese Cake 2-Pound', ur: 'ریڈ ویلوٹ کریم چیز اسپیشل کیک', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'کیک', cost: 1250, sale: 1750 },
    { en: 'Plain Tea Cake Soft Butter Loaf', ur: 'پلین ٹی کیک مکھنی نرم سلائس', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'ڈبہ', cost: 260, sale: 340 },
    { en: 'Dry Fruit Almond Tea Cake Loaf', ur: 'ڈرائی فروٹ بادامی ٹی کیک لوف', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'ڈبہ', cost: 360, sale: 460 },
    { en: 'Chocolate Pastry Cream Layer Single', ur: 'چاکلیٹ پیسٹری تازہ کریم سلائس', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'عدد', cost: 110, sale: 150 },
    { en: 'Pineapple Pastry Fruity Slice', ur: 'پائن ایپل پیسٹری فروٹ فریش', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'عدد', cost: 100, sale: 140 },
    { en: 'Chocolate Brownie Walnut Warm', ur: 'چاکلیٹ اخروٹ براؤنی وارم', catEn: 'Cakes & Pastries', catUr: 'کیکس و پیسٹریز', unit: 'عدد', cost: 130, sale: 180 },

    // Biscuits & Cookies
    { en: 'Naan Khatai Desi Ghee Khalifa Style', ur: 'نان خطائی خالص دیسی گھی خلیفہ اسٹائل', catEn: 'Biscuits & Cookies', catUr: 'بسکٹس و کوکیز', unit: 'Kg', cost: 750, sale: 950 },
    { en: 'Zeera Crispy Salty Cookies Biscuits', ur: 'زیرہ خستہ نمکین بسکٹس بیکری', catEn: 'Biscuits & Cookies', catUr: 'بسکٹس و کوکیز', unit: 'Kg', cost: 520, sale: 680 },
    { en: 'Almond Pistachio Butter Cookies', ur: 'بادام پستہ مکھن کوکیز پریمیم', catEn: 'Biscuits & Cookies', catUr: 'بسکٹس و کوکیز', unit: 'Kg', cost: 680, sale: 880 },
    { en: 'Coconut Crunch Sweet Biscuits', ur: 'کوکونیٹ کرنچ میٹھے بسکٹس', catEn: 'Biscuits & Cookies', catUr: 'بسکٹس و کوکیز', unit: 'Kg', cost: 480, sale: 640 },

    // Bakery Savories & Snacks
    { en: 'Chicken Patties Puff Round Fresh', ur: 'چکن پیٹیز پف پیسٹری تازہ گول', catEn: 'Bakery Snacks & Savories', catUr: 'بیکری نمکیات و اسنیکس', unit: 'عدد', cost: 65, sale: 90 },
    { en: 'Beef Mince Patties Crispy', ur: 'بیف قیمہ پیٹیز خستہ بیکری', catEn: 'Bakery Snacks & Savories', catUr: 'بیکری نمکیات و اسنیکس', unit: 'عدد', cost: 70, sale: 95 },
    { en: 'Chicken Bread Stuffed Cheese Loaf', ur: 'چکن بریڈ بھرپور چکن چیز لوف', catEn: 'Bakery Snacks & Savories', catUr: 'بیکری نمکیات و اسنیکس', unit: 'عدد', cost: 280, sale: 380 },
    { en: 'Chicken Spring Roll Fried Crisp', ur: 'چکن اسپرنگ رول فرائیڈ کرسپی', catEn: 'Bakery Snacks & Savories', catUr: 'بیکری نمکیات و اسنیکس', unit: 'عدد', cost: 60, sale: 85 },
    { en: 'Crispy Aloo Samosa Bakery Cone', ur: 'کرسپی آلو سموسہ بیکری اسپیشل', catEn: 'Bakery Snacks & Savories', catUr: 'بیکری نمکیات و اسنیکس', unit: 'عدد', cost: 35, sale: 50 },
    { en: 'Chicken Samosa Mince Triangle', ur: 'چکن سموسہ تکونہ خستہ چکن', catEn: 'Bakery Snacks & Savories', catUr: 'بیکری نمکیات و اسنیکس', unit: 'عدد', cost: 55, sale: 75 },
    { en: 'Bakery Mini Pizza Chicken Tikka', ur: 'بیکری منی پیزا چکن تکہ چیز', catEn: 'Bakery Snacks & Savories', catUr: 'بیکری نمکیات و اسنیکس', unit: 'عدد', cost: 110, sale: 150 },

    // Breads & Rusks
    { en: 'Milky Bread Large Family Size', ur: 'ملکی ڈبل روٹی بڑی فیملی سائز', catEn: 'Breads, Buns & Rusks', catUr: 'ڈبل روٹی، بن و پاپے', unit: 'پیکٹ', cost: 130, sale: 160 },
    { en: 'Brown Whole Wheat Diet Bread', ur: 'براؤن ہول وہیٹ ڈائیٹ بریڈ', catEn: 'Breads, Buns & Rusks', catUr: 'ڈبل روٹی، بن و پاپے', unit: 'پیکٹ', cost: 140, sale: 175 },
    { en: 'Burger Buns Pair 2-Piece', ur: 'برگر بن جوڑی 2 عدد پیکٹ', catEn: 'Breads, Buns & Rusks', catUr: 'ڈبل روٹی، بن و پاپے', unit: 'پیکٹ', cost: 65, sale: 85 },
    { en: 'Shawarma Bread Pita Pack (5 Pcs)', ur: 'شوارما پیٹا بریڈ 5 عدد پیکٹ', catEn: 'Breads, Buns & Rusks', catUr: 'ڈبل روٹی، بن و پاپے', unit: 'پیکٹ', cost: 95, sale: 130 },
    { en: 'Sweet Bakarkhani Khasta Rusk', ur: 'میٹھی باقر خانی خستہ پاپے', catEn: 'Breads, Buns & Rusks', catUr: 'ڈبل روٹی، بن و پاپے', unit: 'پیکٹ', cost: 140, sale: 180 },
    { en: 'Cake Rusk Double Baked Egg Fresh', ur: 'کیک رسک انڈے والے ڈبل بیکڈ پاپے', catEn: 'Breads, Buns & Rusks', catUr: 'ڈبل روٹی، بن و پاپے', unit: 'ڈبہ', cost: 260, sale: 340 },
    { en: 'Plain Elaichi Rusk Tea Dip', ur: 'سادہ الائچی پاپا چائے والا', catEn: 'Breads, Buns & Rusks', catUr: 'ڈبل روٹی، بن و پاپے', unit: 'پیکٹ', cost: 120, sale: 150 },
  ];

  const variants = [
    { code: 'V1', en: 'Half Kg Box', ur: 'آدھا کلو ڈبہ' },
    { code: 'V2', en: '1 Kg Box Gift', ur: '1 کلو ڈبہ گفٹ پیک' },
    { code: 'V3', en: 'Executive Gold Tin', ur: 'ایگزیکٹو گولڈ پیک' },
    { code: 'V4', en: 'Party Catering Size', ur: 'پارٹی و شادی آرڈر' },
  ];

  const subVariants = [
    { code: 'S1', en: 'Pure Desi Ghee', ur: 'خالص دیسی گھی', mult: 1.0 },
    { code: 'S2', en: 'Premium Sugar Free', ur: 'پریمیم شوگر فری ڈائیٹ', mult: 1.15 },
    { code: 'S3', en: 'Extra Nuts Topping', ur: 'ڈبل بادام پستہ ٹاپنگ', mult: 1.25 },
    { code: 'S4', en: 'Fresh Hot Bakery Batch', ur: 'تازہ گرم بیکری بیج', mult: 1.05 },
  ];

  let idIdx = 1;
  for (const b of baseItems) {
    for (const v of variants) {
      for (const s of subVariants) {
        if (items.length >= 1500) break;
        const cPrice = Math.round(b.cost * s.mult);
        const sPrice = Math.round(b.sale * s.mult);
        const wRate = Math.round(cPrice * 1.08);

        items.push({
          id: `swt-${idIdx.toString().padStart(4, '0')}`,
          preset: 'sweets',
          barcode: nextBarcode(),
          sku: `SWT-${idIdx.toString().padStart(4, '0')}-${v.code}-${s.code}`,
          nameEn: `${b.en} (${v.en} - ${s.en})`,
          nameUr: `${b.ur} (${v.ur} - ${s.ur})`,
          categoryEn: b.catEn,
          categoryUr: b.catUr,
          unit: b.unit,
          costPrice: cPrice,
          salePrice: sPrice,
          wholesaleRate: wRate,
          stock: 0,
          minStockAlert: 10,
        });
        idIdx++;
      }
      if (items.length >= 1500) break;
    }
    if (items.length >= 1500) break;
  }

  while (items.length < 1500) {
    const idStr = idIdx.toString().padStart(4, '0');
    items.push({
      id: `swt-${idStr}`,
      preset: 'sweets',
      barcode: nextBarcode(),
      sku: `SWT-ITEM-${idStr}`,
      nameEn: `Sweets & Bakery Gourmet Delicacy #${idIdx}`,
      nameUr: `سوئیٹس و بیکرز مٹھائی و بیکری آئٹم #${idIdx}`,
      categoryEn: 'Bakery Confectionery',
      categoryUr: 'سوئیٹس و بیکری اشیاء',
      unit: 'عدد',
      costPrice: 180 + (idIdx % 180) * 5,
      salePrice: 240 + (idIdx % 180) * 6,
      wholesaleRate: 210 + (idIdx % 180) * 5,
      stock: 0,
      minStockAlert: 10,
    });
    idIdx++;
  }

  return items;
}

// -------------------------------------------------------------
// 4. GARMENTS & APPAREL (1500 items)
// -------------------------------------------------------------
function generateGarments() {
  const items = [];
  const baseItems = [
    // Men's Wear
    { en: 'Mens Cotton Shalwar Kameez Suit', ur: 'مردانہ کاٹن شلوار قمیض سوٹ', catEn: 'Mens Ethnic Wear', catUr: 'مردانہ روایتی ملبوسات', unit: 'سوٹ', cost: 1800, sale: 2450 },
    { en: 'Mens Wash & Wear Unstitched Suit', ur: 'مردانہ واش اینڈ ویئر ان سلا سوٹ 4 میٹر', catEn: 'Mens Ethnic Wear', catUr: 'مردانہ روایتی ملبوسات', unit: 'سوٹ', cost: 1500, sale: 2100 },
    { en: 'Mens Boski Silk Fabric Suit', ur: 'مردانہ بوسکی سلک کلاسک سوٹ', catEn: 'Mens Ethnic Wear', catUr: 'مردانہ روایتی ملبوسات', unit: 'سوٹ', cost: 3200, sale: 4400 },
    { en: 'Mens Latha White Cotton Suit', ur: 'مردانہ لٹھا خالص سفید کاٹن سوٹ', catEn: 'Mens Ethnic Wear', catUr: 'مردانہ روایتی ملبوسات', unit: 'سوٹ', cost: 2200, sale: 2950 },
    { en: 'Mens Designer Embroidered Kurta', ur: 'مردانہ کڑھائی والا ڈیزائنر کُرتا', catEn: 'Mens Ethnic Wear', catUr: 'مردانہ روایتی ملبوسات', unit: 'عدد', cost: 1200, sale: 1750 },
    { en: 'Mens Stretch Denim Jeans Pants', ur: 'مردانہ ڈینم اسٹریچ جینز پینٹ', catEn: 'Mens Western Wear', catUr: 'مردانہ پینٹ و شرٹ', unit: 'عدد', cost: 1600, sale: 2350 },
    { en: 'Mens Cotton Chino Casual Pants', ur: 'مردانہ کاٹن چینو کیژول پینٹ', catEn: 'Mens Western Wear', catUr: 'مردانہ پینٹ و شرٹ', unit: 'عدد', cost: 1400, sale: 2100 },
    { en: 'Mens Formal Dress Shirt Full Sleeve', ur: 'مردانہ فارمل ڈریس شرٹ فل سلیو', catEn: 'Mens Western Wear', catUr: 'مردانہ پینٹ و شرٹ', unit: 'عدد', cost: 950, sale: 1450 },
    { en: 'Mens Polo Collar Pique T-Shirt', ur: 'مردانہ پولو کالر ٹی شرٹ کاٹن', catEn: 'Mens Western Wear', catUr: 'مردانہ پینٹ و شرٹ', unit: 'عدد', cost: 750, sale: 1150 },
    { en: 'Mens Round Neck Graphic T-Shirt', ur: 'مردانہ راؤنڈ نیک پرنٹڈ ٹی شرٹ', catEn: 'Mens Western Wear', catUr: 'مردانہ پینٹ و شرٹ', unit: 'عدد', cost: 550, sale: 850 },
    { en: 'Mens Fleece Winter Tracksuit', ur: 'مردانہ فلیس گرم ٹریک سوٹ سیٹ', catEn: 'Mens Western Wear', catUr: 'مردانہ پینٹ و شرٹ', unit: 'سوٹ', cost: 1900, sale: 2750 },
    { en: 'Mens Prince Coat Waistcoat Shahi', ur: 'مردانہ پرنس کوٹ واسکٹ شاہی شادی کلیکشن', catEn: 'Mens Ethnic Wear', catUr: 'مردانہ روایتی ملبوسات', unit: 'عدد', cost: 2800, sale: 3950 },

    // Women's Wear
    { en: 'Womens 3-Piece Digital Lawn Suit', ur: 'زنانہ تھری پیس ڈیجیٹل لان سوٹ پرنٹڈ', catEn: 'Womens Ethnic Wear', catUr: 'زنانہ روایتی سوٹس', unit: 'سوٹ', cost: 2200, sale: 3100 },
    { en: 'Womens Embroidered Chiffon Dupatta Suit', ur: 'زنانہ کڑھائی والا شیفون دوپٹہ سوٹ', catEn: 'Womens Ethnic Wear', catUr: 'زنانہ روایتی سوٹس', unit: 'سوٹ', cost: 2800, sale: 3950 },
    { en: 'Womens 2-Piece Linen Khaddar Suit', ur: 'زنانہ ٹو پیس لینن کھدر سرمائی سوٹ', catEn: 'Womens Ethnic Wear', catUr: 'زنانہ روایتی سوٹس', unit: 'سوٹ', cost: 1600, sale: 2350 },
    { en: 'Womens Ready-To-Wear Stitched Kurti', ur: 'زنانہ ریڈی میڈ سلی سلائی کرتی کاٹن', catEn: 'Womens Ethnic Wear', catUr: 'زنانہ روایتی سوٹس', unit: 'عدد', cost: 950, sale: 1450 },
    { en: 'Womens Cotton Cigarette Pants', ur: 'زنانہ کاٹن سگریٹ پینٹس اسٹریچ', catEn: 'Womens Ethnic Wear', catUr: 'زنانہ روایتی سوٹس', unit: 'عدد', cost: 550, sale: 850 },
    { en: 'Womens Flared Palazzo Trousers', ur: 'زنانہ فلیئرڈ پلازو ٹراؤزر پرنٹڈ', catEn: 'Womens Ethnic Wear', catUr: 'زنانہ روایتی سوٹس', unit: 'عدد', cost: 650, sale: 950 },
    { en: 'Womens Black Abaya Burkha Classic', ur: 'زنانہ سادہ بلیک عبایہ نقاب حجاب', catEn: 'Womens Ethnic Wear', catUr: 'زنانہ روایتی سوٹس', unit: 'عدد', cost: 2200, sale: 3200 },
    { en: 'Womens Pure Pashmina Woolen Shawl', ur: 'زنانہ پشمینہ گرم کشمیری شال', catEn: 'Womens Ethnic Wear', catUr: 'زنانہ روایتی سوٹس', unit: 'عدد', cost: 1800, sale: 2650 },

    // Kids Wear
    { en: 'Boys Baba Cotton Kurta Shalwar Suit', ur: 'بابا کڈز کاٹن شلوار قمیض سوٹ', catEn: 'Kids & Infants', catUr: 'بچوں کے ملبوسات', unit: 'سوٹ', cost: 850, sale: 1250 },
    { en: 'Boys Jeans & T-Shirt Party Set', ur: 'بابا کڈز جینز و ٹی شرٹ پارٹی سیٹ', catEn: 'Kids & Infants', catUr: 'بچوں کے ملبوسات', unit: 'سوٹ', cost: 1100, sale: 1650 },
    { en: 'Girls Baby Frock Fancy Net Lace', ur: 'بیبی فراک فینسی نیٹ لیس پارٹی ویئر', catEn: 'Kids & Infants', catUr: 'بچوں کے ملبوسات', unit: 'عدد', cost: 950, sale: 1450 },
    { en: 'Baby Romper Newborn Cotton Suit', ur: 'نیو بارن بے بی رومپر کاٹن آرام دہ', catEn: 'Kids & Infants', catUr: 'بچوں کے ملبوسات', unit: 'عدد', cost: 450, sale: 680 },

    // Hosiery & Undergarments
    { en: 'Mens Pure Cotton Vest Banyan Sleeveless', ur: 'مردانہ خالص کاٹن بنیان سلیولیس', catEn: 'Hosiery & Innerwear', catUr: 'ہوزری و زیر جامہ', unit: 'عدد', cost: 220, sale: 300 },
    { en: 'Mens Elastic Boxer Briefs Underwear', ur: 'مردانہ باکسر انڈر ویئر کاٹن آرام دہ', catEn: 'Hosiery & Innerwear', catUr: 'ہوزری و زیر جامہ', unit: 'عدد', cost: 240, sale: 330 },
    { en: 'Mens Cotton Ankle Socks Pair', ur: 'مردانہ کاٹن اینکل جرابیں جوڑی', catEn: 'Hosiery & Innerwear', catUr: 'ہوزری و زیر جامہ', unit: 'جوڑا', cost: 95, sale: 140 },
    { en: 'School Uniform Socks White/Black Pair', ur: 'سکول یونیفارم جرابیں سفید و سیاہ جوڑی', catEn: 'Hosiery & Innerwear', catUr: 'ہوزری و زیر جامہ', unit: 'جوڑا', cost: 110, sale: 160 },
  ];

  const sizes = [
    { code: 'S', en: 'Small (S)', ur: 'سائز سمال (S)' },
    { code: 'M', en: 'Medium (M)', ur: 'سائز میڈیم (M)' },
    { code: 'L', en: 'Large (L)', ur: 'سائز لارج (L)' },
    { code: 'XL', en: 'Extra Large (XL)', ur: 'سائز ایکسٹرا لارج (XL)' },
    { code: 'XXL', en: 'Double XL (2XL)', ur: 'سائز ڈبل ایکسل (2XL)' },
  ];

  const colors = [
    { code: 'BLK', en: 'Jet Black', ur: 'جیٹ بلیک سیاہ' },
    { code: 'WHT', en: 'Pure White', ur: 'خالص سفید' },
    { code: 'NVY', en: 'Navy Blue', ur: 'نیوی بلو نیلا' },
    { code: 'GRY', en: 'Charcoal Grey', ur: 'سرمئی گرے' },
    { code: 'BGE', en: 'Beige Cream', ur: 'بادامی کریمی' },
    { code: 'MRN', en: 'Deep Maroon', ur: 'گہرا میرون' },
  ];

  let idIdx = 1;
  for (const b of baseItems) {
    for (const sz of sizes) {
      for (const col of colors) {
        if (items.length >= 1500) break;
        const cPrice = b.cost;
        const sPrice = b.sale;
        const wRate = Math.round(cPrice * 1.1);

        items.push({
          id: `gar-${idIdx.toString().padStart(4, '0')}`,
          preset: 'garments',
          barcode: nextBarcode(),
          sku: `GAR-${idIdx.toString().padStart(4, '0')}-${sz.code}-${col.code}`,
          nameEn: `${b.en} (${sz.en} - ${col.en})`,
          nameUr: `${b.ur} (${sz.ur} - ${col.ur})`,
          categoryEn: b.catEn,
          categoryUr: b.catUr,
          unit: b.unit,
          costPrice: cPrice,
          salePrice: sPrice,
          wholesaleRate: wRate,
          stock: 0,
          minStockAlert: 10,
        });
        idIdx++;
      }
      if (items.length >= 1500) break;
    }
    if (items.length >= 1500) break;
  }

  while (items.length < 1500) {
    const idStr = idIdx.toString().padStart(4, '0');
    items.push({
      id: `gar-${idStr}`,
      preset: 'garments',
      barcode: nextBarcode(),
      sku: `GAR-ITEM-${idStr}`,
      nameEn: `Garments Fashion Boutique Item #${idIdx}`,
      nameUr: `گارمنٹس فیشن و ملبوسات آئٹم #${idIdx}`,
      categoryEn: 'Fashion Apparel',
      categoryUr: 'گارمنٹس و ملبوسات',
      unit: 'عدد',
      costPrice: 900 + (idIdx % 100) * 15,
      salePrice: 1350 + (idIdx % 100) * 20,
      wholesaleRate: 1100 + (idIdx % 100) * 15,
      stock: 0,
      minStockAlert: 10,
    });
    idIdx++;
  }

  return items;
}

// -------------------------------------------------------------
// 5. RESTAURANT & FAST FOOD (1500 items)
// -------------------------------------------------------------
function generateRestaurant() {
  const items = [];
  const baseItems = [
    // Biryani & Rice
    { en: 'Special Chicken Biryani Single Plate', ur: 'اسپیشل چکن بریانی سنگل پلیٹ لیگ پیس', catEn: 'Biryani & Rice', catUr: 'بریانی و پلاؤ', unit: 'پلیٹ', cost: 230, sale: 320 },
    { en: 'Special Chicken Biryani Double Plate', ur: 'اسپیشل چکن بریانی ڈبل پلیٹ 2 بوٹی', catEn: 'Biryani & Rice', catUr: 'بریانی و پلاؤ', unit: 'پلیٹ', cost: 360, sale: 490 },
    { en: 'Beef Nalli Biryani Karachi Style', ur: 'بیف نلی بریانی کراچی مصالحہ دار', catEn: 'Biryani & Rice', catUr: 'بریانی و پلاؤ', unit: 'پلیٹ', cost: 420, sale: 580 },
    { en: 'Mutton Dum Pukht Shahi Biryani', ur: 'مٹن دم پخت شاہی بریانی مٹن', catEn: 'Biryani & Rice', catUr: 'بریانی و پلاؤ', unit: 'پلیٹ', cost: 580, sale: 780 },
    { en: 'Chicken Yakhni Pulao Degi A-One', ur: 'چکن یخنی پلاؤ دیگی خوشبودار', catEn: 'Biryani & Rice', catUr: 'بریانی و پلاؤ', unit: 'پلیٹ', cost: 240, sale: 340 },
    { en: 'Plain Sadda Biryani Rice Plate', ur: 'سادہ مصالحہ چاول بریانی رائس پلیٹ', catEn: 'Biryani & Rice', catUr: 'بریانی و پلاؤ', unit: 'پلیٹ', cost: 120, sale: 180 },

    // Karahi & Handi
    { en: 'Chicken Karahi Shinwari Desi Ghee (Half)', ur: 'چکن کڑاہی شینواری دیسی گھی (ہاف)', catEn: 'Karahi, Handi & Gravy', catUr: 'کڑاہی و ہانڈی سالن', unit: 'کڑاہی', cost: 750, sale: 1050 },
    { en: 'Chicken Karahi Shinwari Desi Ghee (Full)', ur: 'چکن کڑاہی شینواری دیسی گھی (فل)', catEn: 'Karahi, Handi & Gravy', catUr: 'کڑاہی و ہانڈی سالن', unit: 'کڑاہی', cost: 1400, sale: 1950 },
    { en: 'Chicken White Creamy Karahi (Half)', ur: 'چکن وائٹ مکھنی کڑاہی کریمی (ہاف)', catEn: 'Karahi, Handi & Gravy', catUr: 'کڑاہی و ہانڈی سالن', unit: 'کڑاہی', cost: 820, sale: 1150 },
    { en: 'Mutton Karahi Namkeen Peshawari (Half)', ur: 'مٹن کڑاہی نمکین پشاوری (ہاف)', catEn: 'Karahi, Handi & Gravy', catUr: 'کڑاہی و ہانڈی سالن', unit: 'کڑاہی', cost: 1400, sale: 1950 },
    { en: 'Chicken Boneless Makhni Handi Clay Pot', ur: 'چکن بون لیس مکھنی ہانڈی مٹکا', catEn: 'Karahi, Handi & Gravy', catUr: 'کڑاہی و ہانڈی سالن', unit: 'ہانڈی', cost: 880, sale: 1250 },
    { en: 'Beef Nalli Nihari Karachi Degh Plate', ur: 'بیف نلی نہاری کراچی دیگی پلیٹ', catEn: 'Karahi, Handi & Gravy', catUr: 'کڑاہی و ہانڈی سالن', unit: 'پلیٹ', cost: 360, sale: 490 },
    { en: 'Chicken Haleem Daleem Shahi Plate', ur: 'چکن شاہی دلیم حلیم فرائیڈ پیاز', catEn: 'Karahi, Handi & Gravy', catUr: 'کڑاہی و ہانڈی سالن', unit: 'پلیٹ', cost: 180, sale: 260 },
    { en: 'Daal Mash Fry Desi Butter Tarka', ur: 'دال ماش فرائی مکھن تڑکا ریسٹورنٹ', catEn: 'Karahi, Handi & Gravy', catUr: 'کڑاہی و ہانڈی سالن', unit: 'پلیٹ', cost: 190, sale: 280 },

    // Fast Food, Burgers & Pizza
    { en: 'Crispy Zinger Burger Spicy Deluxe', ur: 'کرسپی زنگر برگر اسپائسی ڈیلکس چیز', catEn: 'Fast Food & Burgers', catUr: 'فاسٹ فوڈ و برگرز', unit: 'عدد', cost: 260, sale: 380 },
    { en: 'Double Decker Zinger Tower Burger', ur: 'ڈبل ڈیکر زنگر ٹاور برگر جمبو', catEn: 'Fast Food & Burgers', catUr: 'فاسٹ فوڈ و برگرز', unit: 'عدد', cost: 420, sale: 590 },
    { en: 'Chicken Shami Egg Burger Bun Kabab', ur: 'چکن شامی انڈہ برگر بن کباب', catEn: 'Fast Food & Burgers', catUr: 'فاسٹ فوڈ و برگرز', unit: 'عدد', cost: 130, sale: 190 },
    { en: 'Chicken Shawarma Wrap Garlic Mayo', ur: 'چکن شوارما رول مایو گارلک ساس', catEn: 'Fast Food & Burgers', catUr: 'فاسٹ فوڈ و برگرز', unit: 'عدد', cost: 150, sale: 220 },
    { en: 'Zinger Shawarma Cheese Stuffed', ur: 'زنگر شوارما کرسپی چیز بھرا ہوا', catEn: 'Fast Food & Burgers', catUr: 'فاسٹ فوڈ و برگرز', unit: 'عدد', cost: 220, sale: 310 },
    { en: 'Chicken Paratha Roll Mayo Garlic', ur: 'چکن پراٹھا رول مایو گارلک لچھا', catEn: 'Fast Food & Burgers', catUr: 'فاسٹ فوڈ و برگرز', unit: 'عدد', cost: 180, sale: 260 },
    { en: 'Chicken Tikka Pizza Small 7-Inch', ur: 'چکن تکہ پیزا اسمال 7 انچ', catEn: 'Pizza & Italian', catUr: 'پیزا و پاسٹا', unit: 'پیزا', cost: 350, sale: 490 },
    { en: 'Chicken Fajita Pizza Medium 10-Inch', ur: 'چکن فجیتا پیزا میڈیم 10 انچ', catEn: 'Pizza & Italian', catUr: 'پیزا و پاسٹا', unit: 'پیزا', cost: 680, sale: 950 },
    { en: 'Chicken Supreme Pizza Large 13-Inch', ur: 'چکن سپریم پیزا لارج 13 انچ', catEn: 'Pizza & Italian', catUr: 'پیزا و پاسٹا', unit: 'پیزا', cost: 980, sale: 1390 },
    { en: 'Crispy French Fries Regular Masala', ur: 'فرنچ فرائز فنگر کرسپی مصالحہ دار', catEn: 'Fast Food & Burgers', catUr: 'فاسٹ فوڈ و برگرز', unit: 'باکس', cost: 120, sale: 180 },
    { en: 'Loaded Cheese Fries Chicken Chunks', ur: 'لوڈڈ چیز فرائز چکن چنکس کے ساتھ', catEn: 'Fast Food & Burgers', catUr: 'فاسٹ فوڈ و برگرز', unit: 'باکس', cost: 280, sale: 390 },

    // BBQ & Tandoor
    { en: 'Chicken Tikka Chest Piece Barbeque', ur: 'چکن تکہ چیسٹ پیس کوئلہ بی بی کیو', catEn: 'Barbeque & Grills', catUr: 'باربی کیو و تکہ کباب', unit: 'عدد', cost: 240, sale: 340 },
    { en: 'Chicken Tikka Leg Piece Barbeque', ur: 'چکن تکہ لیگ پیس کوئلہ بی بی کیو', catEn: 'Barbeque & Grills', catUr: 'باربی کیو و تکہ کباب', unit: 'عدد', cost: 220, sale: 320 },
    { en: 'Chicken Malai Boti Seekh Plate (8 Pcs)', ur: 'چکن ملائی بوٹی سیخ نرم کریمی', catEn: 'Barbeque & Grills', catUr: 'باربی کیو و تکہ کباب', unit: 'پلیٹ', cost: 380, sale: 540 },
    { en: 'Beef Seekh Kabab Charcoal Plate (4 Pcs)', ur: 'بیف سیخ کباب چارکول لذیذ پلیٹ', catEn: 'Barbeque & Grills', catUr: 'باربی کیو و تکہ کباب', unit: 'پلیٹ', cost: 320, sale: 460 },
    { en: 'Peshawari Chapli Kabab Fried Beef', ur: 'پشاوری چپلی کباب تلا ہوا بیف', catEn: 'Barbeque & Grills', catUr: 'باربی کیو و تکہ کباب', unit: 'عدد', cost: 180, sale: 260 },
    { en: 'Sada Tandoori Naan Hot', ur: 'سادہ تندوری نان گرم فریش', catEn: 'Tandoor & Breads', catUr: 'روٹی و نان', unit: 'عدد', cost: 25, sale: 35 },
    { en: 'Roghani Sesame Naan Butter Glaze', ur: 'روغنی نان تل والا مکھن لگایا ہوا', catEn: 'Tandoor & Breads', catUr: 'روٹی و نان', unit: 'عدد', cost: 50, sale: 70 },
    { en: 'Garlic Butter Naan Tandoori', ur: 'گارلک بٹر نان لہسن مکھن', catEn: 'Tandoor & Breads', catUr: 'روٹی و نان', unit: 'عدد', cost: 70, sale: 100 },
    { en: 'Tandoori Roti Whole Wheat Khasta', ur: 'تندوری روٹی گندم چکی', catEn: 'Tandoor & Breads', catUr: 'روٹی و نان', unit: 'عدد', cost: 18, sale: 25 },

    // Beverages & Tea
    { en: 'Karak Doodh Patti Chai Hotel Style', ur: 'کڑک دودھ پتی چائے ہوٹل اسٹائل', catEn: 'Cafe & Beverages', catUr: 'چائے و مشروبات', unit: 'کپ', cost: 50, sale: 75 },
    { en: 'Elaichi Kehwa Green Tea Cardamom', ur: 'الائچی قہوہ سبز چائے دارچینی', catEn: 'Cafe & Beverages', catUr: 'چائے و مشروبات', unit: 'کپ', cost: 35, sale: 55 },
    { en: 'Sweet Creamy Desi Lassi Glass', ur: 'میٹھی ملائی دار دیسی لسی گلاس', catEn: 'Cafe & Beverages', catUr: 'چائے و مشروبات', unit: 'گلاس', cost: 110, sale: 160 },
    { en: 'Pepsi Cola Can 250ml Chilled', ur: 'پیپسی کولا کین 250 ملی لٹر ٹھنڈا', catEn: 'Cafe & Beverages', catUr: 'چائے و مشروبات', unit: 'کین', cost: 85, sale: 110 },
    { en: 'Coca Cola Bottle 500ml Regular', ur: 'کوکا کولا بوتل 500 ملی لٹر ٹھنڈی', catEn: 'Cafe & Beverages', catUr: 'چائے و مشروبات', unit: 'بوتل', cost: 95, sale: 120 },
    { en: 'Mineral Water Aquafina 500ml', ur: 'منرل واٹر ایکوافینا 500 ملی لٹر', catEn: 'Cafe & Beverages', catUr: 'چائے و مشروبات', unit: 'بوتل', cost: 45, sale: 60 },
  ];

  const portions = [
    { code: 'SGL', en: 'Single Serving', ur: 'سنگل پلیٹ سرونگ' },
    { code: 'DBL', en: 'Double Serving', ur: 'ڈبل پلیٹ فیملی' },
    { code: 'SPL', en: 'Special Chef Recipe', ur: 'شیف اسپیشل ریسیپی' },
    { code: 'DLX', en: 'Deluxe Combo Meal', ur: 'ڈیلکس کومبو کھانا' },
  ];

  const spiceLevels = [
    { code: 'NRM', en: 'Normal Mild Spice', ur: 'نارمل میانہ مصالحہ', mult: 1.0 },
    { code: 'SPY', en: 'Hot & Spicy Extra', ur: 'تیز چٹپٹا مصالحہ دار', mult: 1.05 },
    { code: 'MKH', en: 'Rich Desi Makhan Butter', ur: 'دیسی مکھن تڑکا', mult: 1.15 },
    { code: 'CHS', en: 'Double Melted Cheese', ur: 'ڈبل پگھلا ہوا چیز', mult: 1.25 },
  ];

  let idIdx = 1;
  for (const b of baseItems) {
    for (const pr of portions) {
      for (const sp of spiceLevels) {
        if (items.length >= 1500) break;
        const cPrice = Math.round(b.cost * sp.mult);
        const sPrice = Math.round(b.sale * sp.mult);
        const wRate = Math.round(cPrice * 1.08);

        items.push({
          id: `res-${idIdx.toString().padStart(4, '0')}`,
          preset: 'restaurant',
          barcode: nextBarcode(),
          sku: `RES-${idIdx.toString().padStart(4, '0')}-${pr.code}-${sp.code}`,
          nameEn: `${b.en} (${pr.en} - ${sp.en})`,
          nameUr: `${b.ur} (${pr.ur} - ${sp.ur})`,
          categoryEn: b.catEn,
          categoryUr: b.catUr,
          unit: b.unit,
          costPrice: cPrice,
          salePrice: sPrice,
          wholesaleRate: wRate,
          stock: 0,
          minStockAlert: 10,
        });
        idIdx++;
      }
      if (items.length >= 1500) break;
    }
    if (items.length >= 1500) break;
  }

  while (items.length < 1500) {
    const idStr = idIdx.toString().padStart(4, '0');
    items.push({
      id: `res-${idStr}`,
      preset: 'restaurant',
      barcode: nextBarcode(),
      sku: `RES-ITEM-${idStr}`,
      nameEn: `Restaurant Culinary Special #${idIdx}`,
      nameUr: `ریسٹورنٹ و کیفے اسپیشل کھانا #${idIdx}`,
      categoryEn: 'Dine & Takeaway',
      categoryUr: 'ریسٹورنٹ و کیفے طعام',
      unit: 'پلیٹ',
      costPrice: 200 + (idIdx % 100) * 8,
      salePrice: 290 + (idIdx % 100) * 10,
      wholesaleRate: 240 + (idIdx % 100) * 8,
      stock: 0,
      minStockAlert: 10,
    });
    idIdx++;
  }

  return items;
}

// -------------------------------------------------------------
// 6. CANDY, TOFFEES & CONFECTIONERY (1500 items)
// -------------------------------------------------------------
function generateConfectionery() {
  const items = [];
  const baseItems = [
    // Toffees & Candies
    { en: 'Eclairs Chocolate Cream Toffee Box', ur: 'ایکلیئرز چاکلیٹ کریم ٹافی ڈبہ', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'ڈبہ', cost: 280, sale: 350 },
    { en: 'Butter Scotch Rich Toffee Box', ur: 'بٹر اسکاچ کریمی ٹافی ڈبہ', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'ڈبہ', cost: 260, sale: 330 },
    { en: 'Candyland Butter Toffee Pouch', ur: 'کینڈی لینڈ بٹر ٹافی پاؤچ پیک', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'پیکٹ', cost: 120, sale: 150 },
    { en: 'Khoya Milk Rich Toffee Jar', ur: 'کھویا ملک ٹافی کاؤنٹر جار', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'جار', cost: 420, sale: 520 },
    { en: 'Hilal Ding Dong Toffee Box', ur: 'ہلالی ڈنگ ڈونگ ٹافی ڈبہ', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'ڈبہ', cost: 240, sale: 300 },
    { en: 'Chilli Mili Spicy Jelly Candy Pack', ur: 'چلی ملی چٹپٹی جیلی کینڈی پیکٹ', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Super Sour Tangy Fruit Candy Pack', ur: 'سپر سوور کھٹی میٹھی فروٹ کینڈی', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Kaccha Aam Green Mango Candy', ur: 'کچا آم چٹپٹی کینڈی پیکٹ', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Peppermint Fresh Mint Candy Jar', ur: 'پیپرمنٹ پودینہ ٹھنڈی گولی جار', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'جار', cost: 250, sale: 320 },
    { en: 'Chupa Chups Fruit Lollipop Dispenser', ur: 'چوپا چپ لالی پاپ مختلف فروٹ فلیورز', catEn: 'Toffees & Candies', catUr: 'ٹافیاں و کینڈیز', unit: 'ڈسپنسر', cost: 450, sale: 580 },

    // Bubble Gums
    { en: 'Ding Dong Bubble Gum Original (Box)', ur: 'ڈنگ ڈونگ ببل گم اوریجنل ڈبہ', catEn: 'Bubble Gums', catUr: 'ببل گم و چیونگم', unit: 'ڈبہ', cost: 220, sale: 280 },
    { en: 'Boomer Strawberry Bubble Gum Box', ur: 'بومر سٹرابری ببل گم بڑا ڈبہ', catEn: 'Bubble Gums', catUr: 'ببل گم و چیونگم', unit: 'ڈبہ', cost: 240, sale: 300 },
    { en: 'Fresh Up Peppermint Chewing Gum Pack', ur: 'فریش اپ پیپرمنٹ گم پاکٹ پیک', catEn: 'Bubble Gums', catUr: 'ببل گم و چیونگم', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Center Fresh Liquid Filled Gum Box', ur: 'سینٹر فریش لیکوڈ فلڈ گم ڈبہ', catEn: 'Bubble Gums', catUr: 'ببل گم و چیونگم', unit: 'ڈبہ', cost: 320, sale: 400 },
    { en: 'Center Fruit Splash Juicy Gum Box', ur: 'سینٹر فروٹ جوس بھری گم ڈبہ', catEn: 'Bubble Gums', catUr: 'ببل گم و چیونگم', unit: 'ڈبہ', cost: 320, sale: 400 },

    // Chocolates & Bars
    { en: 'Cadbury Dairy Milk Chocolate 50g Bar', ur: 'کیڈبری ڈیری ملک چاکلیٹ 50 گرام بار', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'عدد', cost: 115, sale: 140 },
    { en: 'Cadbury Dairy Milk Fruit & Nut 90g', ur: 'کیڈبری ڈیری ملک فروٹ اینڈ نٹ 90 گرام', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'عدد', cost: 240, sale: 290 },
    { en: 'Cadbury Dairy Milk Silk Smooth 60g', ur: 'کیڈبری ڈیری ملک سلک نرم و ملائم بار', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'عدد', cost: 210, sale: 260 },
    { en: 'KitKat 4-Finger Crisp Wafer Chocolate', ur: 'کٹ کیٹ 4 فنگر کرسپی ویفر چاکلیٹ', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'عدد', cost: 130, sale: 160 },
    { en: 'Snickers Peanut Caramel Chocolate Bar', ur: 'سنیکرز پی نٹ کیریمل چاکلیٹ بار', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'عدد', cost: 160, sale: 200 },
    { en: 'Mars Nougat Caramel Chocolate Bar', ur: 'مارس نوگاٹ کیریمل چاکلیٹ بار', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'عدد', cost: 160, sale: 200 },
    { en: 'Jubilee Chocolate Caramel Bar Box', ur: 'جوبلی چاکلیٹ کیریمل بار ڈبہ (24 عدد)', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'ڈبہ', cost: 420, sale: 520 },
    { en: 'Sono Chocolate Crisp Wafer Bar Box', ur: 'سونو چاکلیٹ ویفر بار ڈبہ (24 عدد)', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'ڈبہ', cost: 360, sale: 450 },
    { en: 'Nutella Hazelnut Cocoa Spread 350g', ur: 'نٹیلا ہیزل نٹ چاکلیٹ اسپریڈ 350 گرام جار', catEn: 'Chocolates & Bars', catUr: 'چاکلیٹ و سویٹ بارز', unit: 'جار', cost: 950, sale: 1150 },

    // Jellies & Marshmallows
    { en: 'Candyland ABC Jelly Soft Fruit Pouch', ur: 'کینڈی لینڈ اے بی سی فروٹ جیلی پاؤچ', catEn: 'Jellies & Marshmallows', catUr: 'جیلیاں و مارشمیلو', unit: 'پیکٹ', cost: 75, sale: 95 },
    { en: 'Candyland Jelly Worms Gummy Pack', ur: 'کینڈی لینڈ ورم گمی جیلی پیکٹ', catEn: 'Jellies & Marshmallows', catUr: 'جیلیاں و مارشمیلو', unit: 'پیکٹ', cost: 80, sale: 100 },
    { en: 'Candyland Marshmallow Twister Cone', ur: 'کینڈی لینڈ مارشمیلو ٹوئسٹر کون', catEn: 'Jellies & Marshmallows', catUr: 'جیلیاں و مارشمیلو', unit: 'پیکٹ', cost: 65, sale: 85 },

    // Nimko, Chips & Crisps
    { en: 'Lays Potato Chips Masala 50g Bag', ur: 'لیز پوٹیٹو چپس مصالحہ 50 گرام پیکٹ', catEn: 'Nimko, Chips & Crisps', catUr: 'نمکو، چپس و پاپڑ', unit: 'پیکٹ', cost: 65, sale: 80 },
    { en: 'Lays Potato Chips French Cheese 50g', ur: 'لیز چپس فرنچ چیز 50 گرام پیکٹ', catEn: 'Nimko, Chips & Crisps', catUr: 'نمکو، چپس و پاپڑ', unit: 'پیکٹ', cost: 65, sale: 80 },
    { en: 'Kurkure Red Chilli Chatpata 50g', ur: 'کرکرے ریڈ چلی چٹپٹا 50 گرام', catEn: 'Nimko, Chips & Crisps', catUr: 'نمکو، چپس و پاپڑ', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Cheetos Crunchy Cheese Puffs Pack', ur: 'چیٹوز کرسپی چیز پفس پیکٹ', catEn: 'Nimko, Chips & Crisps', catUr: 'نمکو، چپس و پاپڑ', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Nimko Daal Moong Salted Crisp 150g', ur: 'نمکو دال مونگ تلی ہوئی نمکین 150 گرام', catEn: 'Nimko, Chips & Crisps', catUr: 'نمکو، چپس و پاپڑ', unit: 'پیکٹ', cost: 95, sale: 130 },
    { en: 'Nimko Aloo Bhujia Spicy Crunchy 150g', ur: 'نمکو آلو بھجیا چٹپٹی کرسپی 150 گرام', catEn: 'Nimko, Chips & Crisps', catUr: 'نمکو، چپس و پاپڑ', unit: 'پیکٹ', cost: 95, sale: 130 },
    { en: 'Nimko Mix Special Dry Fruit 200g', ur: 'مکس نمکو اسپیشل ڈرائی فروٹ و پی نٹس 200 گرام', catEn: 'Nimko, Chips & Crisps', catUr: 'نمکو، چپس و پاپڑ', unit: 'پیکٹ', cost: 140, sale: 180 },
    { en: 'Salted Roasted Peanuts Mongphali Pack', ur: 'نمکین روسٹڈ مونگ پھلی پیکٹ', catEn: 'Nimko, Chips & Crisps', catUr: 'نمکو، چپس و پاپڑ', unit: 'پیکٹ', cost: 80, sale: 110 },

    // Biscuits & Wafers
    { en: 'LU Prince Chocolate Cream Biscuit Pack', ur: 'پرنس چاکلیٹ کریم بسکٹ پیکٹ', catEn: 'Biscuits & Wafers', catUr: 'بسکٹس و ویفرز', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Peek Freans Sooper Egg & Milk Biscuit', ur: 'سوپر بسکٹ انڈہ و دودھ پیکٹ', catEn: 'Biscuits & Wafers', catUr: 'بسکٹس و ویفرز', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Rio Strawberry & Vanilla Cream Biscuit', ur: 'ریو سٹرابری و ونیلا کریم بسکٹ', catEn: 'Biscuits & Wafers', catUr: 'بسکٹس و ویفرز', unit: 'پیکٹ', cost: 40, sale: 50 },
    { en: 'Chocolate Crisp Layered Wafer Pack', ur: 'چاکلیٹ کرسپی لیئرڈ ویفرز پیکٹ', catEn: 'Biscuits & Wafers', catUr: 'بسکٹس و ویفرز', unit: 'پیکٹ', cost: 45, sale: 60 },
  ];

  const packVariants = [
    { code: 'SGL', en: 'Pocket Single Unit', ur: 'پاکٹ سنگل پیکٹ' },
    { code: 'DUO', en: 'Twin Pack Deal', ur: 'ٹوئن پیک جوڑی' },
    { code: 'BX1', en: 'Retail Counter Box', ur: 'ریٹیل کاؤنٹر ڈبہ' },
    { code: 'JR1', en: 'Wholesale Display Jar', ur: 'ہول سیل ڈسپلے جار' },
  ];

  const flavorVariants = [
    { code: 'FL1', en: 'Original Classic Flavor', ur: 'اوریجنل کلاسک ذائقہ', mult: 1.0 },
    { code: 'FL2', en: 'Extra Crunchy Double Pack', ur: 'ایکسٹرا کرسپی ڈبل پیک', mult: 1.85 },
    { code: 'FL3', en: 'Super Value Family Pack', ur: 'سپر ویلیو فیملی پیک', mult: 2.7 },
    { code: 'FL4', en: 'Party Mega Jar Dispenser', ur: 'پارٹی میگا جار ڈسپنسر', mult: 4.5 },
  ];

  let idIdx = 1;
  for (const b of baseItems) {
    for (const pv of packVariants) {
      for (const fv of flavorVariants) {
        if (items.length >= 1500) break;
        const cPrice = Math.round(b.cost * fv.mult);
        const sPrice = Math.round(b.sale * fv.mult);
        const wRate = Math.round(cPrice * 1.08);

        items.push({
          id: `cnf-${idIdx.toString().padStart(4, '0')}`,
          preset: 'confectionery',
          barcode: nextBarcode(),
          sku: `CNF-${idIdx.toString().padStart(4, '0')}-${pv.code}-${fv.code}`,
          nameEn: `${b.en} (${pv.en} - ${fv.en})`,
          nameUr: `${b.ur} (${pv.ur} - ${fv.ur})`,
          categoryEn: b.catEn,
          categoryUr: b.catUr,
          unit: b.unit,
          costPrice: cPrice,
          salePrice: sPrice,
          wholesaleRate: wRate,
          stock: 0,
          minStockAlert: 10,
        });
        idIdx++;
      }
      if (items.length >= 1500) break;
    }
    if (items.length >= 1500) break;
  }

  while (items.length < 1500) {
    const idStr = idIdx.toString().padStart(4, '0');
    items.push({
      id: `cnf-${idStr}`,
      preset: 'confectionery',
      barcode: nextBarcode(),
      sku: `CNF-ITEM-${idStr}`,
      nameEn: `Confectionery Candy & Toffee Sweet #${idIdx}`,
      nameUr: `گولی ٹافی و کنفیکشنری میٹھی آئٹم #${idIdx}`,
      categoryEn: 'Candy & Sweets',
      categoryUr: 'گولی ٹافی و کینڈیز',
      unit: 'پیکٹ',
      costPrice: 40 + (idIdx % 40) * 2,
      salePrice: 50 + (idIdx % 40) * 3,
      wholesaleRate: 45 + (idIdx % 40) * 2,
      stock: 0,
      minStockAlert: 10,
    });
    idIdx++;
  }

  return items;
}

// -------------------------------------------------------------
// MAIN EXECUTION: COMBINE ALL 6 CATEGORIES (9,000 TOTAL ITEMS)
// -------------------------------------------------------------
console.log('Generating Karyana items...');
const karyanaItems = generateKaryana();
console.log('Karyana count:', karyanaItems.length);

console.log('Generating General Store items...');
const generalItems = generateGeneralStore();
console.log('General Store count:', generalItems.length);

console.log('Generating Sweets & Bakers items...');
const sweetsItems = generateSweetsAndBakers();
console.log('Sweets count:', sweetsItems.length);

console.log('Generating Garments items...');
const garmentsItems = generateGarments();
console.log('Garments count:', garmentsItems.length);

console.log('Generating Restaurant items...');
const restaurantItems = generateRestaurant();
console.log('Restaurant count:', restaurantItems.length);

console.log('Generating Confectionery items...');
const confectioneryItems = generateConfectionery();
console.log('Confectionery count:', confectioneryItems.length);

const allSeedProducts = [
  ...karyanaItems,
  ...generalItems,
  ...sweetsItems,
  ...garmentsItems,
  ...restaurantItems,
  ...confectioneryItems,
];

console.log('Total Seed Products:', allSeedProducts.length);

// Ensure data directory exists
if (!fs.existsSync('data')) {
  fs.mkdirSync('data', { recursive: true });
}

// Write to data/seedProducts.json
fs.writeFileSync('data/seedProducts.json', JSON.stringify(allSeedProducts, null, 2), 'utf8');
console.log('Successfully wrote data/seedProducts.json! Size:', (fs.statSync('data/seedProducts.json').size / 1024 / 1024).toFixed(2), 'MB');
