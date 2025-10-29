import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowRight, Package, Leaf, Apple, Droplets, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import type { Restaurant } from '@/pages/Admin/types';

import vegetablesImg from '@/assets/vegetables.jpg';
import fruitsImg from '@/assets/fruits.jpg';
import groceryImg from '@/assets/grocery.jpg';
import coldDrinksImg from '@/assets/cold-drinks.jpg';
import restaurantImg from '@/assets/aboutus.png';
import heroImg from '@/assets/11111.jpg';
// additional images (may not exist yet) – we will attempt to use them and fall back if needed
import img2 from '@/assets/22222.jpg';
import img3 from '@/assets/33333.jpg';

const categories = [
	{
		id: 'all',
		name: 'All Products',
		description: 'Browse everything we offer',
		image: groceryImg,
		icon: ShoppingCart,
		color: 'from-purple-500 to-purple-600',
		href: '/category/all',
	},
	{
		id: 'grocery',
		name: 'Grocery',
		description: 'Daily essentials & pantry items',
		image: groceryImg,
		icon: Package,
		color: 'from-blue-500 to-blue-600',
		href: '/category/grocery',
	},
	{
		id: 'vegetables',
		name: 'Vegetables',
		description: 'Fresh & organic vegetables',
		image: vegetablesImg,
		icon: Leaf,
		color: 'from-green-500 to-green-600',
		href: '/category/vegetables',
	},
	{
		id: 'fruits',
		name: 'Fruits',
		description: 'Fresh seasonal fruits',
		image: fruitsImg,
		icon: Apple,
		color: 'from-red-500 to-red-600',
		href: '/category/fruits',
	},
	{
		id: 'cold-drinks',
		name: 'Cold Drinks',
		description: 'Refreshing beverages',
		image: coldDrinksImg,
		icon: Droplets,
		color: 'from-cyan-500 to-cyan-600',
		href: '/category/cold-drinks',
	},
	{
		id: 'restaurants',
		name: 'Restaurant Orders',
		description: 'Order freshly prepared meals from local restaurants',
		image: restaurantImg,
		icon: UtensilsCrossed,
		color: 'from-amber-500 to-red-500',
		href: '/restaurants',
	},
];

const Home: React.FC = () => {
	const { user } = useAuth();
	const { getItemCount } = useCart();
	const [restaurantPreview, setRestaurantPreview] = useState<Restaurant[]>([]);
	const [loadingRestaurants, setLoadingRestaurants] = useState(false);
	const [restaurantError, setRestaurantError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRestaurants = async () => {
			setLoadingRestaurants(true);
			setRestaurantError(null);
			try {
				// supabase type definitions in this project may not include the `restaurants` table.
				// Cast to `any` here to avoid excessive type instantiation errors during compile.
				const { data, error } = await (supabase as any)
					.from('restaurants')
					.select('id, name, description, image_url, is_active')
					.eq('is_active', true)
					.order('created_at', { ascending: false })
					.limit(6);

				if (error) {
					throw error;
				}

				setRestaurantPreview((data as any) || []);
			} catch (err) {
				console.error('Error loading restaurants for home page:', err);
				setRestaurantError('Unable to load restaurants right now.');
				setRestaurantPreview([]);
			} finally {
				setLoadingRestaurants(false);
			}
		};

		void fetchRestaurants();
	}, []);

	return (
		<div className="min-h-screen bg-background">
			<Helmet>
				<title>HN Mart - Fresh Groceries Delivered Fast</title>
				<link rel="canonical" href="https://hnmart.in/" />
				<meta name="description" content="HN Mart - Get fresh groceries, vegetables, fruits, and daily essentials delivered to your doorstep in minutes." />
				<script type="application/ld+json">
				{`{
				  "@context": "https://schema.org",
				  "@graph": [
				    {
						"@type": "WebSite",
						"name": "HN Mart",
						"url": "https://hnmart.in",
				      "potentialAction": {
				        "@type": "SearchAction",
						"target": "https://hnmart.in/search?q={search_term_string}",
				        "query-input": "required name=search_term_string"
				      }
				    },
							{
								"@type": "LocalBusiness",
								"name": "HN Mart",
								"image": "https://hnmart.in/",
								"@id": "https://hnmart.in",
								"url": "https://hnmart.in",
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

			{!user && (
				<section className="relative w-full overflow-hidden bg-cover bg-center" style={{ minHeight: '48vh', backgroundImage: `url(${heroImg})` }}>
					{/* overlay for contrast (below content) */}
					<div className="absolute inset-0 bg-black/40 z-0" />
					<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-28 text-center z-10">
						<h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 text-white">
							Fresh Groceries
							<br />
							<span className="text-green-300">Delivered Fast</span>
						</h1>
						<p className="text-sm sm:text-xl md:text-2xl mb-6 text-white/90">
							Get fresh groceries delivered to your doorstep in minutes
						</p>
						<Button
							size="lg"
							className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-4"
							onClick={() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })}
						>
							Start Shopping
							<ArrowRight className="ml-2 w-5 h-5" />
						</Button>
					</div>
				</section>
			)}

			{/* Inline styles for sliding background (kept here to avoid touching global CSS) */}
			<style>{`
			@keyframes slide-left {
				0% { transform: translateX(0%); }
				100% { transform: translateX(-33.3333%); }
			}
			.animate-slide-left {
				animation: slide-left 12s linear infinite;
			}
			`}</style>



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
								<Link key={category.id} to={category.href} className="group" style={{ animationDelay: `${index * 80}ms` }}>
									<Card className="aspect-square overflow-hidden relative">
										<img src={category.image} alt={category.name} className="w-full h-full object-cover" />
										<div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/40 to-transparent text-white">
											<h3 className="font-bold">{category.name}</h3>
											<p className="text-xs">{category.description}</p>
											{category.id === 'restaurants' && (
												<div className="mt-2 space-y-1 text-left">
													{loadingRestaurants ? (
														<p className="text-xs text-white/80">Loading partner restaurants...</p>
													) : restaurantError ? (
														<p className="text-xs text-red-200">{restaurantError}</p>
													) : restaurantPreview.length > 0 ? (
														<ul className="space-y-1 text-xs">
															{restaurantPreview.map((restaurant) => (
																<li key={restaurant.id} className="flex items-center gap-1">
																	<span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
																	<span className="truncate">{restaurant.name}</span>
																</li>
															))}
														</ul>
													) : (
														<p className="text-xs text-white/80">No partner restaurants yet.</p>
													)}
												</div>
											)}
											<Button size="sm" className="mt-2">
												{category.id === 'restaurants' ? 'Order Now' : 'Browse'}{' '}
												<ArrowRight className="ml-1 w-3 h-3" />
											</Button>
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
