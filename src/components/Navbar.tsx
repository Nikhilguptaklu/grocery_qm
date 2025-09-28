import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, User, Home, LogIn, UserPlus, LogOut, Shield, Truck, Info, Menu 
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

const Navbar = () => {
  const { cartItems } = useCart();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setUserRole(null);
      setUserName(null);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
      }

      if (!profile) {
        // Create a minimal profile if it doesn't exist to avoid repeated 500s
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id, email: user.email || '' })
          .select()
          .maybeSingle();
        if (upsertError) {
          console.error('Error creating missing profile:', upsertError);
        }
        setUserRole(null);
        setUserName(null);
        return;
      }

      setUserRole((profile as any)?.role || null);
      setUserName((profile as any)?.name || null);
    } catch (err) {
      console.error('Unexpected error fetching user data:', err);
      setUserRole(null);
      setUserName(null);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card border-b shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              QuickMart
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/about"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive('/about') 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About Us</span>
            </Link>

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
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Hi, {userName || user.email}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {(userRole === 'admin' || userRole === 'delivery') && (
                      <DropdownMenuItem asChild>
                        <Link to="/delivery" className="flex items-center">
                          <Truck className="mr-2 h-4 w-4" />
                          <span>Delivery Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-1">
            <Link to="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t shadow-lg">
          <div className="flex flex-col space-y-2 p-4">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isActive('/') 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/about"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isActive('/about') 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Info className="w-4 h-4" />
              <span>About Us</span>
            </Link>

            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                <ShoppingCart className="w-4 h-4" />
                <span>Cart ({itemCount})</span>
              </div>
            </Link>

            {!user ? (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </div>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </div>
                </Link>
                {userRole === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </div>
                  </Link>
                )}
                {(userRole === 'admin' || userRole === 'delivery') && (
                  <Link to="/delivery" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Truck className="w-4 h-4" />
                      <span>Delivery Dashboard</span>
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
