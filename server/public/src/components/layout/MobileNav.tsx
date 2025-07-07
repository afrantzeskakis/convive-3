import { Link, useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";

export default function MobileNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // For logged-out users, show only public pages
  if (!isAuthenticated) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-3">
          <Link href="/how-it-works" className={`flex flex-col items-center ${location === '/how-it-works' ? 'text-primary' : 'text-gray-600'}`}>
            <i className="fas fa-info-circle text-xl"></i>
            <span className="text-xs mt-1">How It Works</span>
          </Link>
          <Link href="/restaurant-partners" className={`flex flex-col items-center ${location === '/restaurant-partners' ? 'text-primary' : 'text-gray-600'}`}>
            <i className="fas fa-utensils text-xl"></i>
            <span className="text-xs mt-1">Restaurants</span>
          </Link>
          <Link href="/about" className={`flex flex-col items-center ${location === '/about' ? 'text-primary' : 'text-gray-600'}`}>
            <i className="fas fa-building text-xl"></i>
            <span className="text-xs mt-1">About</span>
          </Link>
          <Link href="/auth" className={`flex flex-col items-center ${location === '/auth' ? 'text-primary' : 'text-gray-600'}`}>
            <i className="fas fa-sign-in-alt text-xl"></i>
            <span className="text-xs mt-1">Login</span>
          </Link>
        </div>
      </div>
    );
  }

  // For logged-in users, show all app features
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-3">
        <Link 
          href="/" 
          className={`flex flex-col items-center ${location === '/' ? 'text-primary' : 'text-gray-600'}`}
          onClick={() => {
            // Set bypass flag to prevent admin redirect
            localStorage.setItem('bypass_admin_redirect', 'true');
            console.log("Setting bypass flag and navigating to user view");
          }}
        >
          <i className="fas fa-home text-xl"></i>
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link href="/how-it-works" className={`flex flex-col items-center ${location === '/how-it-works' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-info-circle text-xl"></i>
          <span className="text-xs mt-1">How It Works</span>
        </Link>
        <Link href="/my-meetups" className={`flex flex-col items-center ${location === '/my-meetups' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-calendar-alt text-xl"></i>
          <span className="text-xs mt-1">My Meetups</span>
        </Link>
        <Link href="/find-group-meetups" className={`flex flex-col items-center ${location === '/find-group-meetups' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-users text-xl"></i>
          <span className="text-xs mt-1">Find Groups</span>
        </Link>
        <Link href="/messages" className={`flex flex-col items-center ${location === '/messages' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-comment-alt text-xl"></i>
          <span className="text-xs mt-1">Messages</span>
        </Link>
        <Link href="/profile" className={`flex flex-col items-center ${location === '/profile' ? 'text-primary' : 'text-gray-600'}`}>
          <i className="fas fa-user text-xl"></i>
          <span className="text-xs mt-1">Profile</span>
        </Link>
        {user?.role === "super_admin" && (
          <Link href="/super-admin-dashboard" className={`flex flex-col items-center ${location === '/super-admin-dashboard' ? 'text-primary' : 'text-gray-600'}`}>
            <i className="fas fa-cog text-xl"></i>
            <span className="text-xs mt-1">Admin</span>
          </Link>
        )}
      </div>
    </div>
  );
}
