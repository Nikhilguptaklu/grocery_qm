import { Link } from 'react-router-dom';
import { ArrowRight, Package, Leaf, Apple, Droplets, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import category images
import vegetablesImg from '@/assets/vegetables.jpg';
import fruitsImg from '@/assets/fruits.jpg';
import groceryImg from '@/assets/grocery.jpg';
import coldDrinksImg from '@/assets/cold-drinks.jpg';

const categories = [
  // ✅ New All Products card
  {
    id: 'all',
    name: 'All Products',
    description: 'Browse everything we offer',
    image: groceryImg, // 👉 You can replace this with a generic banner
    icon: ShoppingCart,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'grocery',
    name: 'Grocery',
    description: 'Daily essentials & pantry items',
    image: groceryImg,
    icon: Package,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    description: 'Fresh & organic vegetables',
    image: vegetablesImg,
    icon: Leaf,
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'fruits',
    name: 'Fruits',
    description: 'Fresh seasonal fruits',
    image: fruitsImg,
    icon: Apple,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'cold-drinks',
    name: 'Cold Drinks',
    description: 'Refreshing beverages',
    image: coldDrinksImg,
    icon: Droplets,
    color: 'from-cyan-500 to-cyan-600'
  }
  
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-up">
            Fresh Groceries
            <br />
            <span className="text-secondary-foreground">Delivered Fast</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-up">
            Get fresh groceries delivered to your doorstep in minutes
          </p>
          <div className="animate-fade-up">
            <Button size="lg" variant="secondary" className="shadow-medium">
              Start Shopping
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-muted-foreground">
              Find everything you need in our carefully curated categories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Link 
                  key={category.id} 
                  to={`/category/${category.id}`}
                  className="group animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="h-full hover:shadow-strong transition-all duration-300 transform group-hover:-translate-y-2 border-2 hover:border-primary/20">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                      <div className="absolute top-4 right-4 bg-card/90 p-2 rounded-full shadow-soft">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Browse {category.name}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
