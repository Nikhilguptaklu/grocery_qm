// src/components/layout/Footer.tsx
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-primary/10 to-primary/5 border-t border-border mt-12">
  <div className="max-w-7xl mx-auto px-2 py-2 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
  <div className="flex flex-col items-center gap-2 sm:grid sm:grid-cols-2 md:grid-cols-4 sm:gap-6 md:gap-8">
          {/* Logo + Tagline */}
          <div className="w-full text-center">
            <h2 className="text-[13px] sm:text-xl font-bold text-primary">HN Mart</h2>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1">
              Fresh groceries, fruits, and daily essentials delivered to your doorstep — fast and easy.
            </p>
          </div>

          {/* Shop Categories */}
          <div className="w-full text-center">
            <h3 className="text-[11px] sm:text-base font-semibold text-foreground mb-1 sm:mb-2">Shop</h3>
            <ul className="space-y-1 text-[9px] sm:text-xs text-muted-foreground">
              <li><Link to="/category/grocery" className="hover:text-primary">Grocery</Link></li>
              <li><Link to="/category/vegetables" className="hover:text-primary">Vegetables</Link></li>
              <li><Link to="/category/fruits" className="hover:text-primary">Fruits</Link></li>
              <li><Link to="/category/cold-drinks" className="hover:text-primary">Cold Drinks</Link></li>
              <li><Link to="/category/all" className="hover:text-primary">All Products</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="w-full text-center">
            <h3 className="text-[11px] sm:text-base font-semibold text-foreground mb-1 sm:mb-2">Customer Care</h3>
            <ul className="space-y-1 text-[9px] sm:text-xs text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-primary">FAQs</Link></li>
              <li><Link to="/returns" className="hover:text-primary">Returns & Refunds</Link></li>
            </ul>
          </div>

          {/* Contact + Social */}
          <div className="w-full text-center">
            <h3 className="text-[11px] sm:text-base font-semibold text-foreground mb-1 sm:mb-2">Get in Touch</h3>
            <ul className="space-y-1 text-[9px] sm:text-xs text-muted-foreground">
              <li className="flex items-center justify-center gap-2"><MapPin size={10}/> Your City, India</li>
              <li className="flex items-center justify-center gap-2"><Phone size={10}/> +91 8294291858</li>
              <li className="flex items-center justify-center gap-2"><Mail size={10}/> hnmart@gmail.com</li>
            </ul>
            <div className="flex justify-center space-x-1 sm:space-x-3 mt-1 sm:mt-3">
              <a href="#" className="text-muted-foreground hover:text-primary"><Facebook size={12}/></a>
              <a href="https://www.instagram.com/hnmart_01/" className="text-muted-foreground hover:text-primary"><Instagram size={12}/></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Twitter size={12}/></a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
  <div className="border-t border-border mt-2 pt-1 text-center text-[8px] sm:text-xs text-muted-foreground">
          © {new Date().getFullYear()} HN Mart. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
