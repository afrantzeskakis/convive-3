import { Link, useLocation } from "wouter";

// Public mobile navigation with only links to public pages
export default function PublicMobileNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-3">
        <Link href="/" className={`flex flex-col items-center ${location === '/' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-home text-xl"></i>
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link href="/how-it-works" className={`flex flex-col items-center ${location === '/how-it-works' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-info-circle text-xl"></i>
          <span className="text-xs mt-1">How It Works</span>
        </Link>
        <Link href="/restaurant-partners" className={`flex flex-col items-center ${location === '/restaurant-partners' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-utensils text-xl"></i>
          <span className="text-xs mt-1">Restaurants</span>
        </Link>
        <Link href="/table-access" className={`flex flex-col items-center ${location === '/table-access' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-key text-xl"></i>
          <span className="text-xs mt-1">Table Access</span>
        </Link>
        <Link href="/about" className={`flex flex-col items-center ${location === '/about' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-building text-xl"></i>
          <span className="text-xs mt-1">About</span>
        </Link>
        <Link href="/auth?tab=login" className={`flex flex-col items-center ${location === '/auth' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-sign-in-alt text-xl"></i>
          <span className="text-xs mt-1">Login</span>
        </Link>
      </div>
    </div>
  );
}