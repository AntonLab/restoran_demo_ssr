export const CATEGORY_NAMES = [
  "Breakfasts",
  "Appetizers",
  "Salads",
  "Soups",
  "Main dishes",
  "Pasta",
  "Burgers",
  "BBQ",
  "Sides",
  "Bread",
  "Desserts",
  "Ice cream",
] as const;

export type SeedDish = {
  name: string;
  category: (typeof CATEGORY_NAMES)[number];
  shortDescription: string;
  fullDescription: string;
  weight: string;
  ingredients: string[];
  priceCents: number;
  image: string;
  isChefChoice?: boolean;
  inStock?: boolean;
  favoritesCount: number;
};

export type SeedReview = { dishesRating: number; serviceRating: number; text: string };

export const SEED_DISHES: SeedDish[] = [
  {
    name: "Garden Omelette",
    category: "Breakfasts",
    shortDescription: "Fluffy three-egg omelette with fresh garden vegetables.",
    fullDescription:
      "Three farm eggs folded around sauteed peppers, spinach and tomatoes, finished with soft goat cheese and served with a slice of toast.",
    weight: "280 g",
    ingredients: ["Eggs", "Bell pepper", "Spinach", "Tomato", "Goat cheese"],
    priceCents: 850,
    image: "garden-omelette.jpg",
    favoritesCount: 14,
  },
  {
    name: "Buttermilk Pancakes",
    category: "Breakfasts",
    shortDescription: "Stack of golden pancakes with maple syrup and berries.",
    fullDescription:
      "Three light buttermilk pancakes cooked on a hot griddle, served with warm maple syrup, seasonal berries and whipped butter.",
    weight: "320 g",
    ingredients: ["Flour", "Buttermilk", "Eggs", "Maple syrup", "Blueberries"],
    priceCents: 900,
    image: "buttermilk-pancakes.jpg",
    isChefChoice: true,
    favoritesCount: 41,
  },
  {
    name: "Avocado Toast",
    category: "Breakfasts",
    shortDescription: "Sourdough toast with smashed avocado and a poached egg.",
    fullDescription:
      "Toasted sourdough topped with smashed avocado, lemon, chili flakes and a perfectly poached egg.",
    weight: "240 g",
    ingredients: ["Sourdough", "Avocado", "Egg", "Lemon", "Chili flakes"],
    priceCents: 950,
    image: "avocado-toast.jpg",
    favoritesCount: 22,
  },
  {
    name: "Bruschetta Trio",
    category: "Appetizers",
    shortDescription: "Three crisp toasts with tomato, mushroom and ricotta toppings.",
    fullDescription:
      "Grilled ciabatta slices topped with marinated tomatoes and basil, garlic mushrooms, and ricotta with honey.",
    weight: "220 g",
    ingredients: ["Ciabatta", "Tomato", "Mushrooms", "Ricotta", "Honey", "Basil"],
    priceCents: 750,
    image: "bruschetta-trio.jpg",
    favoritesCount: 18,
  },
  {
    name: "Crispy Calamari",
    category: "Appetizers",
    shortDescription: "Lightly battered calamari rings with lemon aioli.",
    fullDescription:
      "Tender squid rings in a crisp golden coating, served hot with house lemon aioli and a wedge of lemon.",
    weight: "200 g",
    ingredients: ["Squid", "Flour", "Lemon", "Garlic", "Mayonnaise"],
    priceCents: 1100,
    image: "crispy-calamari.jpg",
    favoritesCount: 9,
  },
  {
    name: "Stuffed Mushrooms",
    category: "Appetizers",
    shortDescription: "Baked mushroom caps filled with herb cream cheese.",
    fullDescription:
      "Large button mushrooms stuffed with cream cheese, garlic, parsley and breadcrumbs, baked until golden.",
    weight: "180 g",
    ingredients: ["Mushrooms", "Cream cheese", "Garlic", "Parsley", "Breadcrumbs"],
    priceCents: 820,
    image: "stuffed-mushrooms.jpg",
    inStock: false,
    favoritesCount: 5,
  },
  {
    name: "Caesar Salad",
    category: "Salads",
    shortDescription: "Romaine, parmesan and croutons with classic Caesar dressing.",
    fullDescription:
      "Crisp romaine lettuce tossed in creamy Caesar dressing with shaved parmesan, garlic croutons and grilled chicken.",
    weight: "300 g",
    ingredients: ["Romaine", "Parmesan", "Croutons", "Chicken breast", "Caesar dressing"],
    priceCents: 1050,
    image: "caesar-salad.jpg",
    favoritesCount: 27,
  },
  {
    name: "Greek Salad",
    category: "Salads",
    shortDescription: "Tomatoes, cucumber, olives and feta with oregano.",
    fullDescription:
      "Ripe tomatoes, cucumber, red onion and Kalamata olives topped with a slab of feta and dressed with olive oil and oregano.",
    weight: "280 g",
    ingredients: ["Tomato", "Cucumber", "Red onion", "Olives", "Feta"],
    priceCents: 980,
    image: "greek-salad.jpg",
    favoritesCount: 12,
  },
  {
    name: "Beet and Goat Cheese Salad",
    category: "Salads",
    shortDescription: "Roasted beets with goat cheese, walnuts and arugula.",
    fullDescription:
      "Roasted beets served over peppery arugula with creamy goat cheese, toasted walnuts and a balsamic glaze.",
    weight: "260 g",
    ingredients: ["Beets", "Goat cheese", "Walnuts", "Arugula", "Balsamic glaze"],
    priceCents: 1000,
    image: "beet-goat-cheese-salad.jpg",
    favoritesCount: 0,
  },
  {
    name: "Borscht",
    category: "Soups",
    shortDescription: "Ruby beet soup with beef, served with sour cream.",
    fullDescription:
      "A slow-simmered beet and cabbage soup with tender beef, finished with a spoon of sour cream and fresh dill.",
    weight: "350 ml",
    ingredients: ["Beets", "Cabbage", "Beef", "Potato", "Sour cream", "Dill"],
    priceCents: 800,
    image: "borscht.jpg",
    isChefChoice: true,
    favoritesCount: 33,
  },
  {
    name: "Tomato Basil Soup",
    category: "Soups",
    shortDescription: "Creamy roasted tomato soup with fresh basil.",
    fullDescription:
      "Roasted tomatoes blended with onion, garlic and cream, served with fresh basil and a crisp parmesan crouton.",
    weight: "330 ml",
    ingredients: ["Tomato", "Onion", "Garlic", "Cream", "Basil"],
    priceCents: 700,
    image: "tomato-basil-soup.jpg",
    favoritesCount: 18,
  },
  {
    name: "Mushroom Cream Soup",
    category: "Soups",
    shortDescription: "Velvety soup of wild and button mushrooms.",
    fullDescription:
      "A smooth cream soup made from wild and button mushrooms, thyme and a splash of white wine.",
    weight: "330 ml",
    ingredients: ["Mushrooms", "Cream", "Onion", "Thyme", "White wine"],
    priceCents: 750,
    image: "mushroom-cream-soup.jpg",
    favoritesCount: 8,
  },
  {
    name: "Grilled Salmon",
    category: "Main dishes",
    shortDescription: "Salmon fillet with lemon butter and seasonal vegetables.",
    fullDescription:
      "A pan-seared Atlantic salmon fillet with lemon butter sauce, served with steamed green beans and baby potatoes.",
    weight: "150/200/150 g",
    ingredients: ["Salmon", "Butter", "Lemon", "Green beans", "Baby potatoes"],
    priceCents: 2400,
    image: "grilled-salmon.jpg",
    isChefChoice: true,
    favoritesCount: 48,
  },
  {
    name: "Roast Chicken",
    category: "Main dishes",
    shortDescription: "Half a herb-roasted chicken with pan gravy.",
    fullDescription:
      "Free-range chicken roasted with garlic and rosemary, served with its own gravy and roasted root vegetables.",
    weight: "450 g",
    ingredients: ["Chicken", "Garlic", "Rosemary", "Carrot", "Potato"],
    priceCents: 1900,
    image: "roast-chicken.jpg",
    favoritesCount: 22,
  },
  {
    name: "Beef Stroganoff",
    category: "Main dishes",
    shortDescription: "Tender beef strips in a creamy mushroom sauce.",
    fullDescription:
      "Sauteed beef strips and mushrooms in a rich sour cream sauce, served over buttered egg noodles.",
    weight: "380 g",
    ingredients: ["Beef", "Mushrooms", "Sour cream", "Onion", "Egg noodles"],
    priceCents: 2100,
    image: "beef-stroganoff.jpg",
    favoritesCount: 15,
  },
  {
    name: "Spaghetti Carbonara",
    category: "Pasta",
    shortDescription: "Spaghetti with crisp pancetta, egg and pecorino.",
    fullDescription:
      "Al dente spaghetti tossed with crisp pancetta, egg yolk, pecorino and plenty of black pepper.",
    weight: "340 g",
    ingredients: ["Spaghetti", "Pancetta", "Egg yolk", "Pecorino", "Black pepper"],
    priceCents: 1500,
    image: "spaghetti-carbonara.jpg",
    favoritesCount: 36,
  },
  {
    name: "Penne Arrabbiata",
    category: "Pasta",
    shortDescription: "Penne in a spicy tomato and garlic sauce.",
    fullDescription:
      "Penne tossed in a fiery sauce of crushed tomatoes, garlic and chili, finished with parsley.",
    weight: "320 g",
    ingredients: ["Penne", "Tomato", "Garlic", "Chili", "Parsley"],
    priceCents: 1300,
    image: "penne-arrabbiata.jpg",
    favoritesCount: 15,
  },
  {
    name: "Mushroom Fettuccine",
    category: "Pasta",
    shortDescription: "Fettuccine in a garlic cream sauce with wild mushrooms.",
    fullDescription:
      "Fresh fettuccine with sauteed wild mushrooms in a garlic cream sauce, topped with grated parmesan.",
    weight: "340 g",
    ingredients: ["Fettuccine", "Mushrooms", "Cream", "Garlic", "Parmesan"],
    priceCents: 1450,
    image: "mushroom-fettuccine.jpg",
    inStock: false,
    favoritesCount: 11,
  },
  {
    name: "Classic Cheeseburger",
    category: "Burgers",
    shortDescription: "Beef patty, cheddar, pickles and house sauce on a brioche bun.",
    fullDescription:
      "A juicy beef patty with melted cheddar, crisp lettuce, pickles and our house sauce on a toasted brioche bun.",
    weight: "320 g",
    ingredients: ["Beef patty", "Cheddar", "Brioche bun", "Lettuce", "Pickles", "House sauce"],
    priceCents: 1400,
    image: "classic-cheeseburger.jpg",
    favoritesCount: 52,
  },
  {
    name: "Smokehouse Burger",
    category: "Burgers",
    shortDescription: "Beef patty with bacon, onion rings and smoky barbecue sauce.",
    fullDescription:
      "Double-smoked bacon, a crispy onion ring and smoky barbecue sauce stacked on a flame-grilled beef patty.",
    weight: "380 g",
    ingredients: ["Beef patty", "Bacon", "Onion rings", "Barbecue sauce", "Cheddar"],
    priceCents: 1650,
    image: "smokehouse-burger.jpg",
    isChefChoice: true,
    favoritesCount: 41,
  },
  {
    name: "Veggie Burger",
    category: "Burgers",
    shortDescription: "Black bean and beet patty with avocado and sprouts.",
    fullDescription:
      "A house-made black bean and beet patty topped with avocado, sprouts and chipotle mayo on a seeded bun.",
    weight: "300 g",
    ingredients: ["Black beans", "Beets", "Avocado", "Sprouts", "Seeded bun"],
    priceCents: 1300,
    image: "veggie-burger.jpg",
    favoritesCount: 7,
  },
  {
    name: "Pulled Pork Sandwich",
    category: "BBQ",
    shortDescription: "Slow-smoked pulled pork with tangy slaw.",
    fullDescription:
      "Pork shoulder smoked for twelve hours, pulled and piled on a soft roll with tangy coleslaw.",
    weight: "350 g",
    ingredients: ["Pork shoulder", "Barbecue sauce", "Cabbage", "Soft roll"],
    priceCents: 1500,
    image: "pulled-pork-sandwich.jpg",
    favoritesCount: 29,
  },
  {
    name: "Smoked Beef Ribs",
    category: "BBQ",
    shortDescription: "Fall-off-the-bone beef ribs glazed with barbecue sauce.",
    fullDescription:
      "Beef short ribs smoked low and slow over oak, glazed with house barbecue sauce and served with pickles.",
    weight: "500 g",
    ingredients: ["Beef ribs", "Barbecue sauce", "Paprika", "Brown sugar", "Pickles"],
    priceCents: 3200,
    image: "smoked-beef-ribs.jpg",
    favoritesCount: 29,
  },
  {
    name: "BBQ Chicken Wings",
    category: "BBQ",
    shortDescription: "Crispy wings tossed in sticky barbecue glaze.",
    fullDescription:
      "Oven-baked then grilled chicken wings tossed in a sticky barbecue glaze with a celery stick and ranch dip.",
    weight: "300 g",
    ingredients: ["Chicken wings", "Barbecue sauce", "Celery", "Ranch dressing"],
    priceCents: 1250,
    image: "bbq-chicken-wings.jpg",
    favoritesCount: 20,
  },
  {
    name: "French Fries",
    category: "Sides",
    shortDescription: "Crispy golden fries with sea salt.",
    fullDescription: "Hand-cut potatoes fried twice until crisp, finished with sea salt.",
    weight: "200 g",
    ingredients: ["Potato", "Sunflower oil", "Sea salt"],
    priceCents: 450,
    image: "french-fries.jpg",
    favoritesCount: 33,
  },
  {
    name: "Mashed Potatoes",
    category: "Sides",
    shortDescription: "Silky potato mash with butter and chives.",
    fullDescription:
      "Creamy mashed potatoes whipped with butter and warm milk, topped with chives.",
    weight: "200 g",
    ingredients: ["Potato", "Butter", "Milk", "Chives"],
    priceCents: 500,
    image: "mashed-potatoes.jpg",
    favoritesCount: 0,
  },
  {
    name: "Grilled Vegetables",
    category: "Sides",
    shortDescription: "Zucchini, peppers and eggplant grilled with olive oil.",
    fullDescription:
      "Seasonal vegetables charred on the grill and dressed with olive oil, garlic and fresh herbs.",
    weight: "220 g",
    ingredients: ["Zucchini", "Bell pepper", "Eggplant", "Olive oil", "Garlic"],
    priceCents: 600,
    image: "grilled-vegetables.jpg",
    favoritesCount: 3,
  },
  {
    name: "Garlic Bread",
    category: "Bread",
    shortDescription: "Warm baguette with garlic butter and parsley.",
    fullDescription:
      "A baguette split and baked with garlic butter and parsley until crisp at the edges.",
    weight: "150 g",
    ingredients: ["Baguette", "Butter", "Garlic", "Parsley"],
    priceCents: 400,
    image: "garlic-bread.jpg",
    favoritesCount: 25,
  },
  {
    name: "Focaccia",
    category: "Bread",
    shortDescription: "Rosemary focaccia with flaky sea salt.",
    fullDescription:
      "House-baked focaccia with a crisp crust and soft crumb, brushed with olive oil and rosemary.",
    weight: "180 g",
    ingredients: ["Flour", "Olive oil", "Rosemary", "Sea salt", "Yeast"],
    priceCents: 450,
    image: "focaccia.jpg",
    favoritesCount: 6,
  },
  {
    name: "Sourdough Loaf",
    category: "Bread",
    shortDescription: "Slow-fermented sourdough with a crackling crust.",
    fullDescription:
      "A small sourdough loaf fermented for 36 hours, served warm with salted butter.",
    weight: "250 g",
    ingredients: ["Flour", "Water", "Sourdough starter", "Salt", "Butter"],
    priceCents: 550,
    image: "sourdough-loaf.jpg",
    favoritesCount: 0,
  },
  {
    name: "Tiramisu",
    category: "Desserts",
    shortDescription: "Espresso-soaked ladyfingers layered with mascarpone cream.",
    fullDescription:
      "Ladyfingers dipped in espresso and layered with whipped mascarpone, dusted with cocoa.",
    weight: "160 g",
    ingredients: ["Ladyfingers", "Mascarpone", "Espresso", "Eggs", "Cocoa"],
    priceCents: 800,
    image: "tiramisu.jpg",
    isChefChoice: true,
    favoritesCount: 44,
  },
  {
    name: "New York Cheesecake",
    category: "Desserts",
    shortDescription: "Dense vanilla cheesecake with strawberry compote.",
    fullDescription:
      "A rich baked cheesecake on a buttery biscuit base, served with strawberry compote.",
    weight: "170 g",
    ingredients: ["Cream cheese", "Biscuits", "Butter", "Vanilla", "Strawberries"],
    priceCents: 850,
    image: "new-york-cheesecake.jpg",
    favoritesCount: 26,
  },
  {
    name: "Chocolate Lava Cake",
    category: "Desserts",
    shortDescription: "Warm chocolate cake with a molten center.",
    fullDescription:
      "A warm dark chocolate cake with a molten center, served with a dusting of icing sugar and fresh raspberries.",
    weight: "140 g",
    ingredients: ["Dark chocolate", "Butter", "Eggs", "Sugar", "Raspberries"],
    priceCents: 900,
    image: "chocolate-lava-cake.jpg",
    inStock: false,
    favoritesCount: 38,
  },
  {
    name: "Vanilla Bean Ice Cream",
    category: "Ice cream",
    shortDescription: "Classic creamy vanilla made with real vanilla beans.",
    fullDescription: "Slow-churned custard ice cream flecked with real Madagascar vanilla beans.",
    weight: "120 g",
    ingredients: ["Cream", "Milk", "Egg yolk", "Sugar", "Vanilla bean"],
    priceCents: 500,
    image: "vanilla-bean-ice-cream.jpg",
    favoritesCount: 16,
  },
  {
    name: "Pistachio Gelato",
    category: "Ice cream",
    shortDescription: "Dense Italian-style gelato with roasted pistachios.",
    fullDescription:
      "Italian-style gelato made from roasted Sicilian pistachios, served with crushed nuts on top.",
    weight: "120 g",
    ingredients: ["Pistachios", "Milk", "Cream", "Sugar"],
    priceCents: 600,
    image: "pistachio-gelato.jpg",
    favoritesCount: 16,
  },
  {
    name: "Raspberry Sorbet",
    category: "Ice cream",
    shortDescription: "Dairy-free sorbet bursting with fresh raspberries.",
    fullDescription:
      "A bright, dairy-free sorbet made from fresh raspberries and a squeeze of lemon.",
    weight: "120 g",
    ingredients: ["Raspberries", "Sugar", "Lemon", "Water"],
    priceCents: 550,
    image: "raspberry-sorbet.jpg",
    favoritesCount: 4,
  },
];

export const SEED_REVIEWS: SeedReview[] = [
  {
    dishesRating: 5,
    serviceRating: 5,
    text: "The salmon was cooked perfectly and the staff were so welcoming. We will be back.",
  },
  {
    dishesRating: 5,
    serviceRating: 4,
    text: "Best borscht I have had outside my grandmother's kitchen. Generous portions too.",
  },
  {
    dishesRating: 4,
    serviceRating: 5,
    text: "Lovely evening. Our waiter remembered every detail of our order and suggested great wine.",
  },
  {
    dishesRating: 4,
    serviceRating: 4,
    text: "Burgers are juicy and the fries are crisp. Slightly loud on a Friday night.",
  },
  {
    dishesRating: 5,
    serviceRating: 5,
    text: "The tiramisu alone is worth the trip. Friendly, fast service from start to finish.",
  },
  {
    dishesRating: 3,
    serviceRating: 4,
    text: "The pasta was fine but a bit salty for me. Service was quick and polite.",
  },
  {
    dishesRating: 4,
    serviceRating: 3,
    text: "Great food, though we waited a while for the check. Pancakes were fantastic.",
  },
  {
    dishesRating: 5,
    serviceRating: 4,
    text: "Ordered delivery and everything arrived hot. The smoked ribs fell right off the bone.",
  },
  {
    dishesRating: 3,
    serviceRating: 3,
    text: "Decent meal overall. The soup was lukewarm when it arrived, but they replaced it quickly.",
  },
  {
    dishesRating: 4,
    serviceRating: 5,
    text: "Cozy place with a fresh seasonal menu. The Greek salad was crisp and bright.",
  },
  {
    dishesRating: 5,
    serviceRating: 5,
    text: "Celebrated a birthday here and the team made it special with a free dessert. Wonderful.",
  },
  {
    dishesRating: 4,
    serviceRating: 4,
    text: "Good value for the quality. I particularly liked the garlic bread and the focaccia.",
  },
];
