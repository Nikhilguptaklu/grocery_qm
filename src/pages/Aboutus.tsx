import { Helmet } from 'react-helmet';
import { Store, Truck, ShieldCheck, Users } from "lucide-react";
import founderImg from "@/assets/founder.jpg"; // 👉 replace with your founder image
import ceoImg from "@/assets/ceo.jpg"; // 👉 replace with your CEO image

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>About HN Mart - Your Trusted Grocery Partner</title>
        <meta name="description" content="Learn about HN Mart, your trusted online grocery store for fresh groceries, fast delivery, and great prices. Discover our mission, vision, and team." />
        <meta name="keywords" content="hnmart, about hnmart, grocery store, online shopping, company, mission, vision, team, fresh groceries" />
        <meta property="og:title" content="About HN Mart - Your Trusted Grocery Partner" />
        <meta property="og:description" content="Learn about HN Mart, your trusted online grocery store for fresh groceries, fast delivery, and great prices. Discover our mission, vision, and team." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/public/favicon.ico" />
  <meta property="og:url" content="https://hnmart.in/aboutus" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@hnmart" />
        <meta name="twitter:title" content="About HN Mart - Your Trusted Grocery Partner" />
        <meta name="twitter:description" content="Learn about HN Mart, your trusted online grocery store for fresh groceries, fast delivery, and great prices. Discover our mission, vision, and team." />
        <meta name="twitter:image" content="/public/favicon.ico" />
      </Helmet>
      {/* Hero Section */}
      <section className="relative min-h-[56vh] bg-gradient-to-b from-primary/10 via-transparent to-transparent">
        <div className="absolute inset-0 bg-[url('/src/assets/aboutus.jpg')] bg-cover bg-center opacity-50"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-3 py-1 rounded-full mb-6">
            <Store className="w-5 h-5" />
            <span className="text-sm font-medium">Local • Fresh • Fast</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            HN Mart — Grocery made simple
          </h1>
          <p className="text-base sm:text-lg max-w-3xl mx-auto text-muted-foreground">
            Fresh produce, everyday essentials and curated local favorites — delivered to your
            doorstep with care. We believe in honest pricing, reliable delivery, and putting
            customers first.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a href="/signup" className="inline-flex items-center bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow hover:shadow-lg transition font-medium">
              Get Started
            </a>
            <a href="/contact" className="inline-flex items-center text-primary underline-offset-4 hover:underline">
              Contact sales
            </a>
          </div>
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
            We envision HN Mart as the go-to marketplace for every 
            household need, offering products across categories 
            with the fastest and most reliable delivery system.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Why Shop With Us?</h2>
          <div className="grid gap-8 md:grid-cols-4 sm:grid-cols-2">
            <div className="bg-card p-6 rounded-2xl hover:shadow-lg transition transform hover:-translate-y-1">
              <Store className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Wide Selection</h3>
              <p className="text-sm text-muted-foreground">
                Thousands of products across categories to meet all your needs.
              </p>
            </div>
            <div className="bg-card p-6 rounded-2xl hover:shadow-lg transition transform hover:-translate-y-1">
              <Truck className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Superfast and reliable delivery to your doorstep.
              </p>
            </div>
            <div className="bg-card p-6 rounded-2xl hover:shadow-lg transition transform hover:-translate-y-1">
              <ShieldCheck className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Trusted Quality</h3>
              <p className="text-sm text-muted-foreground">
                Every product is quality-checked to ensure satisfaction.
              </p>
            </div>
            <div className="bg-card p-6 rounded-2xl hover:shadow-lg transition transform hover:-translate-y-1">
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
<section className="max-w-6xl mx-auto px-6 py-20">
  <h2 className="text-3xl font-bold mb-8 text-center">Meet Our Leadership</h2>

  <div className="grid md:grid-cols-2 gap-8">
    {/* CEO */}
    <div className="flex gap-6 items-center bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition">
      <img
        src={founderImg}
        alt="CEO"
        className="w-36 h-36 object-cover rounded-full shadow-md"
      />
      <div>
        <h3 className="text-xl font-semibold">Nikhil Gupta</h3>
        <p className="text-sm text-muted-foreground mb-3">CEO, HN Mart</p>
        <p className="text-muted-foreground leading-relaxed">Nikhil started HN Mart with a vision to revolutionize shopping. He leads with innovation and customer-first values.</p>
      </div>
    </div>

    {/* Founder */}
    <div className="flex gap-6 items-center bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition">
      <img
        src={ceoImg}
        alt="Founder"
        className="w-36 h-36 object-cover rounded-full shadow-md"
      />
      <div>
        <h3 className="text-xl font-semibold">Harshita Tiwari</h3>
        <p className="text-sm text-muted-foreground mb-3">Founder, HN Mart</p>
        <p className="text-muted-foreground leading-relaxed">Harshita laid the foundation of HN Mart with passion and dedication, bringing creativity and a customer-first mindset to the company.</p>
      </div>
    </div>
  </div>
</section>


      {/* Call to Action */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-3">Were More Than Just a Store</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">HN Mart is built by a passionate team that believes shopping should be effortless, enjoyable, and affordable for everyone.</p>
          <a href="/contact" className="inline-flex items-center bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow hover:shadow-lg transition font-medium">Contact Us</a>
        </div>
      </section>
    </div>
  );
}
