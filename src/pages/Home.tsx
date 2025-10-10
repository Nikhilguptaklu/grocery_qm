import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowRight, Package, Leaf, Apple, Droplets, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import vegetablesImg from '@/assets/vegetables.jpg';
import fruitsImg from '@/assets/fruits.jpg';
import groceryImg from '@/assets/grocery.jpg';
import coldDrinksImg from '@/assets/cold-drinks.jpg';

const categories = [
	{ id: 'all', name: 'All Products', description: 'Browse everything we offer', image: groceryImg, icon: ShoppingCart, color: 'from-purple-500 to-purple-600' },
	{ id: 'grocery', name: 'Grocery', description: 'Daily essentials & pantry items', image: groceryImg, icon: Package, color: 'from-blue-500 to-blue-600' },
	{ id: 'vegetables', name: 'Vegetables', description: 'Fresh & organic vegetables', image: vegetablesImg, icon: Leaf, color: 'from-green-500 to-green-600' },
	{ id: 'fruits', name: 'Fruits', description: 'Fresh seasonal fruits', image: fruitsImg, icon: Apple, color: 'from-red-500 to-red-600' },
	{ id: 'cold-drinks', name: 'Cold Drinks', description: 'Refreshing beverages', image: coldDrinksImg, icon: Droplets, color: 'from-cyan-500 to-cyan-600' }
];

const Home: React.FC = () => {
	return (
		<div className="min-h-screen bg-background">
			<Helmet>
				<title>HN Mart - Fresh Groceries Delivered Fast</title>
				<link rel="canonical" href="https://hnmart.com/" />
				<meta name="description" content="HN Mart - Get fresh groceries, vegetables, fruits, and daily essentials delivered to your doorstep in minutes." />
				<script type="application/ld+json">
				{`{
				  "@context": "https://schema.org",
				  "@graph": [
				    {
				      "@type": "WebSite",
				      "name": "HN Mart",
				      "url": "https://hnmart.com",
				      "potentialAction": {
				        "@type": "SearchAction",
				        "target": "https://hnmart.com/search?q={search_term_string}",
				        "query-input": "required name=search_term_string"
				      }
				    },
							{
								"@type": "LocalBusiness",
								"name": "HN Mart",
								"image": "https://hnmart.in/",
								"@id": "https://hnmart.com",
								"url": "https://hnmart.com",
								"telephone": "+91-8294291858",
								"address": {
									"@type": "PostalAddress",
									"streetAddress": "123 Duncan Road Raxaul",
									"addressLocality": "Raxaul",
									"addressRegion": "MH",
									"postalCode": "845305",
									"addressCountry": "IN"
								},
								"priceRange": "₹"
							}
				  ]
				}`}
				</script>
			</Helmet>

			<section className="bg-gradient-hero text-primary-foreground py-10 sm:py-20">
				<div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-center">
					<h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
						Fresh Groceries
						<br />
						<span className="text-secondary-foreground">Delivered Fast</span>
					</h1>
					<p className="text-sm sm:text-xl md:text-2xl mb-4 sm:mb-8 opacity-90">
						Get fresh groceries delivered to your doorstep in minutes
					</p>
					<div>
						<Button
							size="lg"
							variant="secondary"
							onClick={() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })}
						>
							Start Shopping
							<ArrowRight className="ml-2 w-5 h-5" />
						</Button>
					</div>
				</div>
			</section>

			<section id="categories-section" className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Shop by Category</h2>
						<p className="text-xl text-muted-foreground">Find everything you need in our carefully curated categories</p>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
						{categories.map((category, index) => {
							const Icon = category.icon;
							return (
								<Link key={category.id} to={`/category/${category.id}`} className="group" style={{ animationDelay: `${index * 80}ms` }}>
									<Card className="aspect-square overflow-hidden relative">
										<img src={category.image} alt={category.name} className="w-full h-full object-cover" />
										<div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/40 to-transparent text-white">
											<h3 className="font-bold">{category.name}</h3>
											<p className="text-xs">{category.description}</p>
											<Button size="sm" className="mt-2">Browse <ArrowRight className="ml-1 w-3 h-3" /></Button>
										</div>
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
