import { Helmet } from 'react-helmet';
import { Store, Truck, ShieldCheck, Users } from "lucide-react";
import founderImg from "@/assets/founder.jpg"; // 👉 replace with your founder image
import ceoImg from "@/assets/ceo.jpg"; // 👉 replace with your CEO image

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About HN Mart - Your Trusted Grocery Partner</title>
        <meta name="description" content="Learn about HN Mart, your trusted online grocery store for fresh groceries, fast delivery, and great prices. Discover our mission, vision, and team." />
        <meta name="keywords" content="hnmart, about hnmart, grocery store, online shopping, company, mission, vision, team, fresh groceries" />
        <meta property="og:title" content="About HN Mart - Your Trusted Grocery Partner" />
        <meta property="og:description" content="Learn about HN Mart, your trusted online grocery store for fresh groceries, fast delivery, and great prices. Discover our mission, vision, and team." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/public/favicon.ico" />
        <meta property="og:url" content="https://hnmart.com/aboutus" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@hnmart" />
        <meta name="twitter:title" content="About HN Mart - Your Trusted Grocery Partner" />
        <meta name="twitter:description" content="Learn about HN Mart, your trusted online grocery store for fresh groceries, fast delivery, and great prices. Discover our mission, vision, and team." />
        <meta name="twitter:image" content="/public/favicon.ico" />
      </Helmet>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            About <span className="text-yellow-300">QuickMart</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto opacity-90">
            QuickMart is your trusted online shopping destination — bringing 
            quality products, fast delivery, and great prices to your doorstep.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our mission is simple — to make shopping easier, faster, and 
            more affordable for everyone. We combine technology with 
            customer care to deliver an unmatched shopping experience.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            We envision QuickMart as the go-to marketplace for every 
            household need, offering products across categories 
            with the fastest and most reliable delivery system.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Why Shop With Us?</h2>
          <div className="grid gap-8 md:grid-cols-4 sm:grid-cols-2">
            <div className="bg-card shadow-soft p-6 rounded-2xl hover:shadow-lg transition">
              <Store className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Wide Selection</h3>
              <p className="text-sm text-muted-foreground">
                Thousands of products across categories to meet all your needs.
              </p>
            </div>
            <div className="bg-card shadow-soft p-6 rounded-2xl hover:shadow-lg transition">
              <Truck className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Superfast and reliable delivery to your doorstep.
              </p>
            </div>
            <div className="bg-card shadow-soft p-6 rounded-2xl hover:shadow-lg transition">
              <ShieldCheck className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Trusted Quality</h3>
              <p className="text-sm text-muted-foreground">
                Every product is quality-checked to ensure satisfaction.
              </p>
            </div>
            <div className="bg-card shadow-soft p-6 rounded-2xl hover:shadow-lg transition">
              <Users className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Customer First</h3>
              <p className="text-sm text-muted-foreground">
                24/7 customer support and hassle-free returns.
              </p>
            </div>
          </div>
        </div>
      </section>

     {/* Founder & CEO */}
<section className="max-w-6xl mx-auto px-6 py-20 text-center">
  <h2 className="text-3xl font-bold mb-12">Meet Our Leadership</h2>

  <div className="grid md:grid-cols-2 gap-12">
    {/* CEO */}
    <div className="bg-card shadow-soft rounded-2xl p-10 flex flex-col items-center">
      <img
        src={founderImg}
        alt="CEO"
        className="w-56 h-56 object-cover rounded-full shadow-lg mb-6"
      />
      <h3 className="text-2xl font-semibold">Nikhil Gupta</h3>
      <p className="text-muted-foreground text-sm mb-4">CEO, QuickMart</p>
      <p className="max-w-md text-muted-foreground leading-relaxed">
        Nikhil Gupta started QuickMart with a vision to revolutionize shopping. 
        With a background in technology and retail, he leads with innovation, 
        trust, and customer-first values.
      </p>
    </div>

    {/* Founder */}
    <div className="bg-card shadow-soft rounded-2xl p-10 flex flex-col items-center">
      <img
        src={ceoImg}
        alt="Founder"
        className="w-56 h-56 object-cover rounded-full shadow-lg mb-6"
      />
      <h3 className="text-2xl font-semibold">Harshita Tiwari</h3>
      <p className="text-muted-foreground text-sm mb-4">Founder, QuickMart</p>
      <p className="max-w-md text-muted-foreground leading-relaxed">
        Harshita laid the foundation of QuickMart with passion and dedication. 
        She brings creativity and a customer-first mindset, ensuring the company 
        always delivers value and quality.
      </p>
    </div>
  </div>
</section>


      {/* Call to Action */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">We’re More Than Just a Store</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          QuickMart is built by a passionate team that believes shopping should 
          be effortless, enjoyable, and affordable for everyone.
        </p>
        <a
          href="/contact"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl shadow hover:shadow-lg transition font-medium"
        >
          Contact Us
        </a>
      </section>
    </div>
  );
}
