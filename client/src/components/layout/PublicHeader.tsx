import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

// Public header with only links to public pages (How it Works, About, Restaurant Partners)
export default function PublicHeader() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="text-primary font-poppins font-bold text-2xl cursor-pointer">Convive</span>
                <span className="text-slate-400 italic text-base ml-2.5 font-light tracking-wide">(Come·Vibe)</span>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                Home
              </Link>
              <Link href="/how-it-works" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/how-it-works' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                How It Works
              </Link>
              <Link href="/restaurant-partners" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/restaurant-partners' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                Restaurants
              </Link>
              <Link href="/table-access" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/table-access' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                Table Access
              </Link>
              <Link href="/about" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/about' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex space-x-3">
              <Button variant="outline" className="text-primary" asChild>
                <Link href="/auth?tab=login">Login</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/auth?tab=register">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}