import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContextProvider";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="flex items-center"
                onClick={() => {
                  // Set bypass flag to prevent admin redirect
                  localStorage.setItem('bypass_admin_redirect', 'true');
                  console.log("Setting bypass flag and navigating to user view");
                }}
              >
                <span className="text-primary font-poppins font-bold text-2xl cursor-pointer">Convive</span>
                <span className="text-slate-400 italic text-base ml-2.5 font-light tracking-wide">(Come·Vibe)</span>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                onClick={() => {
                  // Set bypass flag to prevent admin redirect
                  localStorage.setItem('bypass_admin_redirect', 'true');
                  console.log("Setting bypass flag and navigating to user view");
                }}
              >
                Home
              </Link>
              <Link href="/how-it-works" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/how-it-works' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                How It Works
              </Link>
              <Link href="/restaurant-partners" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/restaurant-partners' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                Restaurants
              </Link>
              <Link href="/my-meetups" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/my-meetups' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                My Meetups
              </Link>
              <Link href="/find-group-meetups" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/find-group-meetups' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                Find Meetups
              </Link>
              <Link href="/messages" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/messages' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                Messages
              </Link>
              <Link href="/table-access" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/table-access' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                Table Access
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <button className="bg-white p-1 rounded-full text-gray-600 hover:text-primary focus:outline-none mr-3">
                  <i className="fas fa-bell text-xl"></i>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage 
                        src={typeof user?.profilePicture === 'string' ? user.profilePicture : undefined} 
                        alt={user?.fullName || 'User'} 
                      />
                      <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/how-it-works">How It Works</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-meetups">My Meetups</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/find-group-meetups">Find Group Meetups</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/table-access">Table Access</Link>
                    </DropdownMenuItem>
                    {user?.role === "restaurant_admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/restaurant-admin-dashboard">Manage Restaurants</Link>
                      </DropdownMenuItem>
                    )}
                    {user?.role === "super_admin" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/super-admin-dashboard">Return to Super Admin Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/simple-wine-upload">Simple Wine Upload</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/wine-upload">Wine Upload Page</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex space-x-3">
                <div className="hidden md:flex items-center mr-4">
                  <Link href="/how-it-works" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/how-it-works' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                    How It Works
                  </Link>
                  <Link href="/restaurant-partners" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/restaurant-partners' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                    Restaurants
                  </Link>
                  <Link href="/about" className={`px-3 py-2 rounded-md text-sm font-medium ${location === '/about' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                    About
                  </Link>
                </div>
                
                <Button variant="outline" className="text-primary" asChild>
                  <Link href="/auth">Login</Link>
                </Button>
                <Button className="bg-primary hover:bg-primary/90" asChild>
                  <Link href="/auth">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
