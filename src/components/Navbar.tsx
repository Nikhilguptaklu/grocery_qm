import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Home, LogIn, UserPlus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { getItemCount } = useCart();
  const location = useLocation();
  const itemCount = getItemCount();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card border-b shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              QuickMart
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Link to="/cart">
              <Button 
                variant={isActive('/cart') ? 'default' : 'ghost'} 
                size="sm" 
                className="relative"
              >
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-scale-in">
                    {itemCount}
                  </span>
                )}
                <span className="ml-2 hidden sm:inline">Cart</span>
              </Button>
            </Link>

            {/* Auth Links */}
            <Link to="/login">
              <Button 
                variant={isActive('/login') ? 'default' : 'outline'} 
                size="sm"
              >
                <LogIn className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">Login</span>
              </Button>
            </Link>
            
            <Link to="/signup">
              <Button 
                variant={isActive('/signup') ? 'secondary' : 'ghost'} 
                size="sm"
              >
                <UserPlus className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">Sign Up</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;