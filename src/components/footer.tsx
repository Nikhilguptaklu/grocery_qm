// src/components/layout/Footer.tsx
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-primary/10 to-primary/5 border-t border-border mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo + Tagline */}
          <div>
            <h2 className="text-2xl font-bold text-primary">QuickMart</h2>
            <p className="text-muted-foreground mt-2">
              Fresh groceries, fruits, and daily essentials delivered to your doorstep — fast and easy.
            </p>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Shop</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/category/grocery" className="hover:text-primary">Grocery</Link></li>
              <li><Link to="/category/vegetables" className="hover:text-primary">Vegetables</Link></li>
              <li><Link to="/category/fruits" className="hover:text-primary">Fruits</Link></li>
              <li><Link to="/category/cold-drinks" className="hover:text-primary">Cold Drinks</Link></li>
              <li><Link to="/category/all" className="hover:text-primary">All Products</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Customer Care</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-primary">FAQs</Link></li>
              <li><Link to="/returns" className="hover:text-primary">Returns & Refunds</Link></li>
            </ul>
          </div>

          {/* Contact + Social */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Get in Touch</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin size={16}/> Your City, India</li>
              <li className="flex items-center gap-2"><Phone size={16}/> +91 98765 43210</li>
              <li className="flex items-center gap-2"><Mail size={16}/> support@quickmart.com</li>
            </ul>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-muted-foreground hover:text-primary"><Facebook size={20}/></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Instagram size={20}/></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Twitter size={20}/></a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-10 pt-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} QuickMart. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
