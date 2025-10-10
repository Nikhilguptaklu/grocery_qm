import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <Helmet>
        <title>Contact Us - HN Mart</title>
        <meta name="description" content="Get in touch with HN Mart for support, feedback or partnership inquiries." />
      </Helmet>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Info panel */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Get in touch</CardTitle>
            <p className="text-muted-foreground mt-2">We’re here to help — send us a message and we’ll get back to you within 24 hours.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Email</h4>
                  <p className="text-sm text-muted-foreground">hnmart@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Phone</h4>
                  <p className="text-sm text-muted-foreground">+91 8294291858</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Head Office</h4>
                  <p className="text-sm text-muted-foreground">12 Market Duncan Road, Raxaul, India</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Prefer immediate help? Use the chat bubble at the bottom-right to start a quick conversation.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Send us a message</CardTitle>
            <p className="text-muted-foreground mt-2">Tell us about your query and we’ll reply as soon as possible.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent (stub)'); }}>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your full name" required />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" required />
              </div>

              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" placeholder="10 digit phone" />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="How can we help?" rows={6} required />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">We'll never share your details.</div>
                <Button type="submit">Send Message</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactUs;
