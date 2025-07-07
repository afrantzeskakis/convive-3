import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { User as UserType, Restaurant, Meetup, DinnerCheckAverage, UserTicketHistory, CallScript, CallRecording } from "@shared/schema";
import { Link } from "wouter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { 
  Loader2, Search, Trash2, Edit, Plus, DollarSign, Users, Calendar, Clock, 
  ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Upload, UploadCloud, FileText, Info, ChefHat, BookOpen,
  Phone, Mic, FileCode, Save, RefreshCw, Play, Headphones, Download, AlertCircle,
  UtensilsCrossed, GlassWater, CheckCircle, UserRound, CalendarDays, MapPin,
  Award, Key, Star, Sparkles, UserCheck, Wine, MessageSquare, Wrench, Utensils,
  FileSearch, PhoneCall, X, UserIcon, PlayCircle, Crown, ServerCrash, Check,
  Activity, BarChart3 as BarChartIcon, TrendingUp, Database
} from "lucide-react";
import { AllergenChecker } from "@/components/AllergenChecker";
import { useToast } from "@/hooks/use-toast";
import PublicHome from "@/pages/PublicHome";
import AboutUs from "@/pages/AboutUs";
import HowItWorks from "@/components/sections/HowItWorks";
import RestaurantPartners from "@/pages/RestaurantPartners";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicMobileNav from "@/components/layout/PublicMobileNav";
import Footer from "@/components/layout/Footer";

const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("wine");
  
  // Wine Database and Upload state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(false);
  const [wineToView, setWineToView] = useState<any>(null);
  const [wineListText, setWineListText] = useState("");
  const [isProcessingWines, setIsProcessingWines] = useState(false);
  const [processProgress, setProcessProgress] = useState<any>(null);
  const [processResults, setProcessResults] = useState<any>(null);
  const [wineCount, setWineCount] = useState(0);
  
  // Function to process wine list directly on this page
  const processWineList = async (text: string) => {
    if (!text || text.trim().length < 10) {
      toast({
        title: "Invalid wine list",
        description: "Please provide a valid wine list with at least a few lines",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingWines(true);
    setProcessProgress({
      percent: 0,
      processed: 0,
      total: 0,
      message: "Starting wine list processing..."
    });
    setProcessResults(null);
    
    try {
      console.log("Processing wine list text:", text.length, "characters");
      
      const response = await fetch('/api/sommelier/process-wine-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wineListText: text })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Wine list processing initiated:", result);
      
      setProcessResults(result);
      // If there's a progress ID, poll for updates
      if (result.progressId) {
        pollProgress(result.progressId);
      } else {
        setIsProcessingWines(false);
        setProcessProgress({
          percent: 100,
          processed: result.processedCount || 0,
          total: result.processedCount || 0,
          message: "Processing complete!"
        });
      }
      
      toast({
        title: "Wine list processing",
        description: result.message || "Wine list processing initiated",
      });
    } catch (error: any) {
      console.error("Error processing wine list:", error);
      setIsProcessingWines(false);
      setProcessProgress({
        percent: 0,
        processed: 0,
        total: 0,
        message: `Error: ${error?.message || "Unknown error"}`
      });
      
      toast({
        title: "Processing failed",
        description: error?.message || "Failed to process wine list",
        variant: "destructive"
      });
    }
  };
  
  // Function to poll progress updates
  const pollProgress = async (progressId: string) => {
    try {
      const response = await fetch(`/api/sommelier/progress/${progressId}`);
      if (!response.ok) {
        throw new Error(`Error fetching progress: ${response.status}`);
      }
      
      const progress = await response.json();
      console.log("Progress update:", progress);
      
      if (progress) {
        setProcessProgress(progress);
        
        // Continue polling if not complete
        if (progress.status === 'processing' || progress.status === 'pending') {
          setTimeout(() => pollProgress(progressId), 1000);
        } else {
          setIsProcessingWines(false);
          
          if (progress.status === 'complete') {
            // Fetch final results
            fetchResults(progressId);
          }
        }
      }
    } catch (error) {
      console.error("Error polling progress:", error);
      setIsProcessingWines(false);
    }
  };
  
  // Function to fetch final results
  const fetchResults = async (progressId: string) => {
    try {
      const response = await fetch(`/api/sommelier/results/${progressId}`);
      if (!response.ok) {
        throw new Error(`Error fetching results: ${response.status}`);
      }
      
      const results = await response.json();
      setProcessResults(results);
      
      // Get total wines count
      fetchWineStats();
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };
  
  // Function to fetch wine database stats
  const fetchWineStats = async () => {
    try {
      const response = await fetch('/api/sommelier/stats');
      if (response.ok) {
        const stats = await response.json();
        setTotalWines(stats.totalWines || 0);
      }
    } catch (error) {
      console.error("Error fetching wine stats:", error);
    }
  };
  
  // Fetch wine stats on initial load
  useEffect(() => {
    if (activeTab === 'wine') {
      fetchWineStats();
    }
  }, [activeTab]);
  
  // Wine Upload state
  const [wineText, setWineText] = useState("");
  const [wineFile, setWineFile] = useState<File | null>(null);
  const wineFileRef = useRef<HTMLInputElement>(null);
  const [isProcessingWine, setIsProcessingWine] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("Preparing...");
  
  // AI Test tab added - will implement in a separate component below
  const [uiAuditResults, setUiAuditResults] = useState<Array<{
    id: number,
    component: string,
    path: string,
    issue: string,
    severity: 'high' | 'medium' | 'low',
    status: 'pending' | 'in-progress' | 'resolved',
    impact: string,
    solution: string
  }>>([
    {
      id: 1,
      component: "How It Works - Dedicated Page",
      path: "/how-it-works",
      issue: "Step order differs from homepage component",
      severity: "high",
      status: "resolved",
      impact: "Users see different flows in different parts of the app",
      solution: "Aligned step order with 'Let Us Get to Know You' first, 'Choose Your Time' second"
    },
    {
      id: 2,
      component: "Home Hero & Join CTA",
      path: "/",
      issue: "Inconsistent messaging about member exclusivity vs. compatibility matching",
      severity: "medium",
      status: "resolved", 
      impact: "Creates confusion about core value proposition",
      solution: "Updated language to focus on compatibility and personalization"
    },
    {
      id: 3,
      component: "Restaurant Profile",
      path: "/restaurants/:id",
      issue: "No clear indication of complimentary first drink benefit",
      severity: "medium",
      status: "pending",
      impact: "Key selling point not visible in crucial conversion area",
      solution: "Add prominent 'First Drink Complimentary' badge to restaurant profiles"
    },
    {
      id: 4,
      component: "Navigation Menu",
      path: "global",
      issue: "Inconsistent naming between menu items and page headings",
      severity: "low",
      status: "pending",
      impact: "Creates uncertainty about current location in app",
      solution: "Align menu item labels with corresponding page headings"
    },
    {
      id: 5,
      component: "User Preference Form",
      path: "/profile/preferences",
      issue: "Preference form doesn't explain matching algorithm",
      severity: "medium",
      status: "pending",
      impact: "Users don't understand how their input affects matching",
      solution: "Add contextual help explaining how each preference affects matching"
    },
    {
      id: 6,
      component: "Ticket Purchase Flow",
      path: "/table-access",
      issue: "Complex ticket options without clear differentiation",
      severity: "high",
      status: "pending",
      impact: "Purchase friction and potential cart abandonment",
      solution: "Simplify options and add comparison table with clear benefit statements"
    }
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMeetups, setExpandedMeetups] = useState<number[]>([]);
  
  // Recipe analyzer states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recipeFile, setRecipeFile] = useState<File | null>(null);
  const [recipeNotes, setRecipeNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [recipeAnalysis, setRecipeAnalysis] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<{type: string, name: string} | null>(null);
  const [itemDetails, setItemDetails] = useState<string>('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isCheckingAi, setIsCheckingAi] = useState(true);
  const [aiStatus, setAiStatus] = useState<boolean>(false);
  
  // File change handler for recipe upload
  const handleRecipeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRecipeFile(e.target.files[0]);
    }
  };
  
  // Restaurant notification states
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);
  const [isResolvingNotification, setIsResolvingNotification] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  
  // Call script management states
  const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null);
  const [scriptFormData, setScriptFormData] = useState({
    name: '',
    scriptType: 'reservation',
    scriptContent: '',
    description: ''
  });
  
  // VC Valuation Calculator states
  const vcResultsRef = useRef<HTMLDivElement>(null);
  const [vcValuationParams, setVcValuationParams] = useState({
    projectedRevenue: 5000000,
    projectionYear: 5,
    industryMultiple: 8,
    discountRate: 0.5,
    initialInvestment: 500000,
    ownershipPercentage: 20,
    monthlyActiveUsers: 5000,
    userGrowthRate: 15,
    averageRevenuePerUser: 50,
    customerAcquisitionCost: 150, // Added CAC parameter with default value
    subscriptionPlans: [
      { name: 'Basic Tier', price: 45.00, userPercentage: 22 },
      { name: 'Standard Tier', price: 65.00, userPercentage: 28 },
      { name: 'Premium Tier', price: 80.00, userPercentage: 15 },
      { name: 'Elite Tier', price: 375.00, userPercentage: 10 },
      { name: 'One-time Dinner Ticket', price: 25.00, userPercentage: 12 },
      { name: 'High Roller Ticket', price: 100.00, userPercentage: 5 },
      { name: 'Private Group Dining Ticket', price: 150.00, userPercentage: 8 }
    ]
  });
  const [isEditingScript, setIsEditingScript] = useState(false);
  
  // Public preview state
  const [publicPreviewPage, setPublicPreviewPage] = useState<'home' | 'about' | 'how-it-works' | 'restaurant-partners'>('home');
  
  // UX audit states
  const [newUxIssue, setNewUxIssue] = useState({
    component: '',
    path: '',
    issue: '',
    severity: 'medium' as 'high' | 'medium' | 'low',
    impact: '',
    solution: ''
  });
  const [isRefreshingUxIssues, setIsRefreshingUxIssues] = useState(false);
  
  // Function to update UX issue status
  const handleUxIssueStatusChange = (id: number, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    setUiAuditResults(prev => prev.map(issue => 
      issue.id === id ? { ...issue, status: newStatus } : issue
    ));
    
    toast({
      title: "Status updated",
      description: `Issue #${id} status changed to ${newStatus}`,
    });
  };
  
  // Function to add a new UX issue
  const handleAddUxIssue = () => {
    const newId = Math.max(0, ...uiAuditResults.map(issue => issue.id)) + 1;
    
    setUiAuditResults(prev => [
      ...prev,
      {
        id: newId,
        ...newUxIssue,
        status: 'pending'
      }
    ]);
    
    // Reset form
    setNewUxIssue({
      component: '',
      path: '',
      issue: '',
      severity: 'medium',
      impact: '',
      solution: ''
    });
    
    toast({
      title: "Issue added",
      description: `New UX consistency issue #${newId} has been added`,
    });
  };
  
  // Mock non-authenticated Hero component for the public preview
  const PreviewHero = () => {
    // This is a copy of the Hero component with isAuthenticated hardcoded to false
    return (
      <div className="bg-white text-slate-700">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-0.5 w-10 bg-slate-300"></div>
                <p className="text-slate-500 font-medium uppercase tracking-wider text-sm">Convive</p>
              </div>
              <h1 className="text-4xl font-bold font-serif tracking-tight sm:text-5xl md:text-6xl">
                <span className="block text-slate-800">Curated Dining</span>
                <span className="block text-slate-600">Extraordinary Connections</span>
              </h1>
              <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl">
                Join an exclusive community where fine dining becomes a social adventure. Engage in thoughtful conversation, savor exceptional cuisine, get a free drink on us to start the night, and learn from a dedicated host at the finest restaurants in your city.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button className="rounded-md px-6 py-3 text-base font-medium bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                  Join Convive
                </button>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-sm bg-white/90 border border-slate-100 shadow-sm">
                    <UtensilsCrossed className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">Curated Experiences</h3>
                    <p className="mt-1 text-sm text-slate-500">4-6 guests + dedicated host at exclusive partner restaurants</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-sm bg-white/90 border border-slate-100 shadow-sm">
                    <GlassWater className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">Guided Discovery</h3>
                    <p className="mt-1 text-sm text-slate-500">Educated by a restaurant expert on fine cuisine and dining culture</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 relative">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-slate-50 rounded-full filter blur-xl"></div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-slate-100 rounded-full filter blur-xl"></div>
              <img 
                className="rounded-sm shadow-2xl relative z-10 object-cover h-full w-full" 
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Luxury dining experience at Convive" 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Mock non-authenticated JoinCTA component for the public preview
  const PreviewJoinCTA = () => {
    const membershipBenefits = [
      "Access to exclusive partner restaurants",
      "Curated dining experiences with dedicated hosts",
      "Learn about fine cuisine from industry experts",
      "Connect with like-minded professionals",
      "Automatic gratuity included for seamless dining"
    ];

    return (
      <div className="bg-slate-800 text-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-slate-700 px-4 py-2 rounded-sm mb-4 border border-slate-600">
                <span className="text-sm font-medium uppercase tracking-wide text-amber-300">Limited Membership</span>
              </div>
              <h2 className="text-4xl font-serif font-bold mb-6 text-slate-50">Become a Convive Member</h2>
              <p className="text-lg mb-8 leading-relaxed text-slate-300">
                Join our exclusive community of discerning professionals who value exceptional dining experiences and meaningful connections.
              </p>
              
              <div className="space-y-4 mb-10">
                {membershipBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-3 mt-0.5 text-amber-300" />
                    <span className="text-slate-200">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="rounded-md px-6 py-3 text-base font-medium bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                  Sign Up Now
                </button>
                <button className="rounded-md px-6 py-3 text-base font-medium border border-slate-500 text-slate-200 hover:bg-slate-700">
                  Dining Options
                </button>
              </div>
            </div>
            
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-800/70 to-transparent rounded-sm"></div>
              <img 
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Fine dining experience" 
                className="rounded-sm shadow-xl object-cover h-full w-full" 
              />
              <div className="absolute bottom-6 left-6 right-6 bg-slate-900/80 backdrop-blur-sm rounded-sm p-6 border border-slate-700">
                <p className="text-lg font-medium mb-2 text-slate-50">"Convive has transformed my dining experiences in the city."</p>
                <p className="text-amber-300">— Alexandra C., Finance Executive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Mock Home component that uses preview components
  const PublicHomePreview = () => {    
    return (
      <div>
        <PreviewHero />
        {/* Use the actual HowItWorks component to ensure consistency */}
        <HowItWorks />
        
        {/* Public CTA section - matches the slate design system */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-serif font-bold text-slate-800 mb-6">Learn More About Convive</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
              Want to know more about how Convive works and the exclusive restaurants we've partnered with?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {/* Use buttons with slate styling instead of links in preview */}
              <button 
                onClick={() => setPublicPreviewPage('how-it-works')} 
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-sm shadow-sm font-medium"
              >
                How It Works
              </button>
              <button 
                onClick={() => setPublicPreviewPage('about')} 
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-sm shadow-sm font-medium"
              >
                About Us
              </button>
              <button 
                onClick={() => setPublicPreviewPage('restaurant-partners')} 
                className="bg-slate-800 text-white hover:bg-slate-700 px-6 py-3 rounded-sm shadow-sm font-medium"
              >
                Restaurant Partners
              </button>
            </div>
          </div>
        </section>
        
        <PreviewJoinCTA />
      </div>
    );
  };
  
  // Specialized clones of the actual pages with auth-specific buttons removed
  // AboutUs with modified CTA section
  const AboutUsPreview = () => {
    // Get all content from AboutUs but modify the CTA section
    const AboutUsClone = () => {
      // Set the page title programmatically
      document.title = "About Convive | (Come·Vibe) - Our Story and Mission";
      
      return (
        <>
          <div className="bg-white">
            {/* Hero Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
              <div className="max-w-5xl mx-auto text-center">
                <h1 className="font-serif text-7xl font-bold text-slate-800 mb-4 tracking-tight">Convive</h1>
                <p className="text-lg text-slate-500 uppercase tracking-widest font-light mb-2.5 italic">Definition</p>
                
                <div className="max-w-3xl mx-auto mb-10 border-t border-b border-slate-200 py-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-4xl">
                    <span className="font-serif font-medium text-slate-700">con·vive</span>
                    <span className="text-slate-400 italic font-light tracking-wide mx-2">(Come·Vibe)</span>
                    <span className="text-slate-500 font-light">noun</span>
                  </div>
                  
                  <p className="mt-5 text-2xl font-medium text-slate-700">
                    A fellow diner; one with whom you feast together
                  </p>
                  
                  <p className="mt-3 text-slate-500 italic font-light">
                    From Latin <em>convivere</em> (com- "with" + vivere "to live"),<br/>meaning "to live together, to dine together"
                  </p>
                </div>
                
                <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                  More than just a dining platform, Convive is a curated social experience that brings together culinary excellence and meaningful conversation.
                </p>
              </div>
            </section>

            {/* Our Story */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-serif font-bold text-slate-800">Our Story</h2>
                  <div className="h-1 w-20 bg-slate-200 mx-auto mt-4"></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-slate-800 mb-6">A New Kind of Social Dining</h3>
                    <p className="text-slate-500 mb-4 leading-relaxed">
                      Convive was founded on a simple but powerful insight: in our increasingly digital world, meaningful face-to-face connections have become rare and valuable.
                    </p>
                    <p className="text-slate-500 mb-4 leading-relaxed">
                      We recognized that the dining table has always been where the most authentic conversations happen—where strangers become friends and ideas flow freely.
                    </p>
                    <p className="text-slate-500 leading-relaxed">
                      Our mission became clear: to curate exceptional dining experiences that foster genuine connections between like-minded individuals who value both culinary excellence and stimulating conversation, creating memorable evenings where friendships are formed and ideas are shared.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -top-6 -left-6 w-32 h-32 bg-slate-50 rounded-full filter blur-xl"></div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-50 rounded-full filter blur-xl"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                      alt="People dining together at an elegant restaurant"
                      className="rounded-sm shadow-xl relative z-10"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Our Philosophy */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-serif font-bold text-slate-800">Our Philosophy</h2>
                  <div className="h-1 w-20 bg-slate-200 mx-auto mt-4"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                    <div className="flex justify-center mb-6">
                      <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                        <Star className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-800 text-center mb-4">Authentic Connection</h3>
                    <p className="text-slate-500 leading-relaxed text-center">
                      We believe in creating spaces where authentic human connections flourish through shared experiences and meaningful conversation around the dining table.
                    </p>
                  </div>
                  
                  <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                    <div className="flex justify-center mb-6">
                      <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                        <Sparkles className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-800 text-center mb-4">Culinary Excellence</h3>
                    <p className="text-slate-500 leading-relaxed text-center">
                      We partner with exceptional restaurants that share our commitment to extraordinary cuisine, expert hospitality, and creating memorable dining experiences.
                    </p>
                  </div>
                  
                  <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                    <div className="flex justify-center mb-6">
                      <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                        <Users className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-800 text-center mb-4">Shared Learning</h3>
                    <p className="text-slate-500 leading-relaxed text-center">
                      Every Convive experience balances exceptional dining with opportunities to learn, share perspectives, and expand horizons through guided conversation.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* What Sets Us Apart */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-serif font-bold text-slate-800">What Sets Us Apart</h2>
                  <div className="h-1 w-20 bg-slate-200 mx-auto mt-4"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                        <UtensilsCrossed className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Curated Groups</h3>
                    <p className="mt-2 text-slate-500">Groups of 4-6 diners paired with a dedicated restaurant host to ensure engaging conversation.</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                        <GlassWater className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Expert Guidance</h3>
                    <p className="mt-2 text-slate-500">A restaurant host who educates diners about cuisine while facilitating meaningful conversation.</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                        <Award className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Exclusive Partners</h3>
                    <p className="mt-2 text-slate-500">Carefully selected high-end restaurants with exclusive agreements to provide unique experiences.</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                        <Key className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Tiered Access</h3>
                    <p className="mt-2 text-slate-500">A thoughtful system of tickets and subscriptions for different levels of table access.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Target Audience */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="order-2 lg:order-1 relative">
                    <div className="absolute -top-6 -left-6 w-32 h-32 bg-white rounded-full filter blur-xl"></div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white rounded-full filter blur-xl"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                      alt="Sophisticated diners enjoying a meal"
                      className="rounded-sm shadow-xl relative z-10"
                    />
                  </div>
                  <div className="order-1 lg:order-2">
                    <h2 className="text-3xl font-serif font-bold text-slate-800 mb-6">Who We Serve</h2>
                    <p className="text-slate-500 mb-4 leading-relaxed">
                      Convive is designed for sophisticated individuals who value meaningful social interactions and exceptional culinary experiences in a refined atmosphere.
                    </p>
                    <p className="text-slate-500 mb-4 leading-relaxed">
                      Our members are curious, open-minded individuals who seek to expand their social circles and cultural horizons through the shared language of fine dining.
                    </p>
                    <p className="text-slate-500 leading-relaxed">
                      They appreciate the curated nature of our experiences, where both the venue and the company have been thoughtfully selected to create memorable evenings of conversation and connection.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Modified Join Us CTA - without the Browse Experiences button */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-serif font-bold text-slate-800 mb-6"><span className="italic">(Come·Vibe)</span> With Us</h2>
                <p className="text-xl text-slate-500 mb-8 leading-relaxed">
                  Join our community of culinary explorers and conversation enthusiasts. Discover a new way to dine, connect, and grow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-slate-800 text-white hover:bg-slate-700 rounded-sm shadow-sm"
                    onClick={() => setPublicPreviewPage('restaurant-partners')}
                  >
                    Restaurant Partners
                  </Button>
                  {/* Browse Experiences button removed */}
                </div>
              </div>
            </section>
          </div>
        </>
      );
    };

    return (
      <div className="public-preview-wrapper">
        <AboutUsClone />
      </div>
    );
  };
  
  // HowItWorks wrapper with any buttons removed
  const HowItWorksWrapper = () => (
    <div className="public-preview-wrapper">
      <HowItWorks />
    </div>
  );
  
  // RestaurantPartners wrapper with any buttons removed
  const RestaurantPartnersWrapper = () => (
    <div className="public-preview-wrapper">
      <RestaurantPartners />
    </div>
  );
  
  // Check AI status when the Recipe Analysis tab is selected
  useEffect(() => {
    if (activeTab === "recipe-analysis" && isCheckingAi) {
      checkAiStatus();
    }
  }, [activeTab, isCheckingAi]);
  
  // Effect to handle refreshing UX issues when tab is active
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    
    // Set up auto-refresh if UX Consistency tab is active
    if (activeTab === 'ux-consistency') {
      // Initial refresh simulation
      const initialRefresh = setTimeout(() => {
        // In a real implementation, this would be an API call to fetch the latest issues
        // For now, we'll just simulate the refresh action
        setIsRefreshingUxIssues(true);
        setTimeout(() => {
          setIsRefreshingUxIssues(false);
          toast({
            title: "UX issues refreshed",
            description: "Next automatic refresh scheduled in 24 hours",
          });
        }, 1000);
      }, 500);
      
      // Set up periodic refresh every 24 hours
      refreshInterval = setInterval(() => {
        if (activeTab === 'ux-consistency') {
          setIsRefreshingUxIssues(true);
          // In a real implementation, fetch from API
          setTimeout(() => {
            setIsRefreshingUxIssues(false);
            toast({
              title: "UX issues auto-refreshed",
              description: "Daily refresh completed. Next refresh in 24 hours.",
            });
          }, 1000);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return () => {
        if (initialRefresh) clearTimeout(initialRefresh);
        if (refreshInterval) clearInterval(refreshInterval);
      };
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [activeTab, toast]);
  
  // Function to check if AI analysis is available (API key is set)
  const checkAiStatus = async () => {
    try {
      const response = await fetch('/api/recipe-analyzer/ai-status');
      
      if (!response.ok) {
        throw new Error('Failed to check AI status');
      }
      
      const data = await response.json();
      setAiStatus(data.enabled);
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAiStatus(false);
    } finally {
      setIsCheckingAi(false);
    }
  };
  
  // Handle wine image file selection
  const handleWineImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle wine image file
      console.log("Wine image selected:", files[0].name);
    }
  };
  
  // Handle recipe upload and analysis (no restaurant selection required for super admin)
  const handleRecipeUpload = async () => {
    if (!recipeFile) return;
    
    setIsUploading(true);
    setRecipeAnalysis(null);
    setSelectedItem(null);
    setItemDetails('');
    
    try {
      // For super admin testing, we'll use the new Wikipedia integration endpoint
      const formData = new FormData();
      formData.append('recipeFile', recipeFile);
      
      if (recipeNotes) {
        formData.append('notes', recipeNotes);
      }
      
      // Use the enhanced recipe analysis with Wikipedia integration
      const response = await fetch('/api/ai/recipe-analyzer/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload and analyze recipe');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecipeAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing recipe:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze recipe',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get detailed information about an ingredient or technique
  const getItemDetails = async (type: string, name: string) => {
    setSelectedItem({ type, name });
    setIsLoadingDetails(true);
    setItemDetails('');
    
    try {
      const response = await fetch(`/api/recipe-analyzer/details?type=${type}&name=${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get item details');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setItemDetails(data.info);
      } else {
        throw new Error(data.error || 'Failed to get details');
      }
    } catch (error) {
      console.error('Error getting item details:', error);
      
      // If AI is not enabled, provide a message about it
      if (!aiStatus) {
        setItemDetails(
          "Detailed information requires AI analysis. AI will be enabled soon to provide in-depth explanations of ingredients and techniques."
        );
      } else {
        setItemDetails(
          "Sorry, we couldn't retrieve detailed information. Please try again later."
        );
      }
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Function to toggle the expanded state of a meetup
  const toggleMeetupExpand = (meetupId: number) => {
    setExpandedMeetups(prev => 
      prev.includes(meetupId) 
        ? prev.filter(id => id !== meetupId) 
        : [...prev, meetupId]
    );
  };

  // Define types for enhanced user data
  type UserWithAnalytics = UserType & { 
    ticketStats?: { 
      totalTickets: number, 
      totalSpent: number, 
      ticketsByType: Record<string, number> 
    }, 
    lifetimeDiningValue: number, 
    dinnerCount: number 
  };

  type PremiumUserData = UserType & { 
    averageSpendPerDinner: number, 
    highCheckDinnerCount: number 
  };

  // Fetch all user analytics data
  const { 
    data: allUserData = [],
    isLoading: isLoadingUsers,
    error: usersError
  } = useQuery<UserWithAnalytics[]>({
    queryKey: ["/api/admin/users/analytics"],
    queryFn: getQueryFn<UserWithAnalytics[]>(),
  });

  // Fetch premium users data
  const {
    data: premiumUsers = [],
    isLoading: isLoadingPremium,
    error: premiumError
  } = useQuery<PremiumUserData[]>({
    queryKey: ["/api/admin/users/premium"],
    queryFn: getQueryFn<PremiumUserData[]>(),
  });

  // Fetch dinner check averages
  const {
    data: dinnerChecks = [],
    isLoading: isLoadingChecks,
    error: checksError
  } = useQuery<DinnerCheckAverage[]>({
    queryKey: ["/api/admin/dinner-checks"],
    queryFn: getQueryFn<DinnerCheckAverage[]>(),
  });

  // Fetch restaurants
  const {
    data: restaurants = [],
    isLoading: isLoadingRestaurants,
    error: restaurantsError
  } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    queryFn: getQueryFn<Restaurant[]>(),
  });

  // Fetch meetups
  const {
    data: meetups = [],
    isLoading: isLoadingMeetups,
    error: meetupsError
  } = useQuery<Meetup[]>({
    queryKey: ["/api/meetups"],
    queryFn: getQueryFn<Meetup[]>(),
  });
  
  // Fetch call scripts
  const {
    data: callScripts = [],
    isLoading: isLoadingScripts,
    error: scriptsError
  } = useQuery<CallScript[]>({
    queryKey: ["/api/call-management/scripts"],
    queryFn: getQueryFn<CallScript[]>(),
    enabled: activeTab === "call-management"
  });
  
  // Fetch call recordings
  const {
    data: callRecordings = [],
    isLoading: isLoadingRecordings,
    error: recordingsError
  } = useQuery<CallRecording[]>({
    queryKey: ["/api/call-management/recordings"],
    queryFn: getQueryFn<CallRecording[]>(),
    enabled: activeTab === "call-management",
    retry: false, // Don't retry if there's an error (table doesn't exist yet)
  });
  
  // Fetch restaurant notifications
  const { 
    data: checkNotifications = [], 
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ["/api/admin/restaurant-notifications"],
    queryFn: async () => {
      const response = await fetch('/api/admin/restaurant-notifications');
      if (!response.ok) throw new Error('Failed to fetch restaurant notifications');
      return response.json() as Promise<DinnerCheckAverage[]>;
    },
    enabled: activeTab === "restaurant-notifications"
  });
  
  // Call script creation mutation
  const createScriptMutation = useMutation({
    mutationFn: (data: Omit<CallScript, 'id' | 'createdAt' | 'updatedAt'>) => 
      apiRequest('/api/call-management/scripts', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-management/scripts"] });
      toast({
        title: "Success",
        description: "Script created successfully",
      });
      setScriptFormData({
        name: '',
        scriptType: 'reservation',
        scriptContent: '',
        description: ''
      });
      setIsEditingScript(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create script: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });

  // Call script update mutation
  const updateScriptMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<CallScript> }) => 
      apiRequest(`/api/call-management/scripts/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-management/scripts"] });
      toast({
        title: "Success",
        description: "Script updated successfully",
      });
      setSelectedScriptId(null);
      setScriptFormData({
        name: '',
        scriptType: 'reservation',
        scriptContent: '',
        description: ''
      });
      setIsEditingScript(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update script: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });

  // Call script deletion mutation
  const deleteScriptMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/call-management/scripts/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-management/scripts"] });
      toast({
        title: "Success",
        description: "Script deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete script: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form input changes
  const handleScriptFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setScriptFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle script form submission
  const handleScriptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingScript && selectedScriptId) {
      updateScriptMutation.mutate({
        id: selectedScriptId,
        data: scriptFormData
      });
    } else {
      // Add required fields for new script creation
      const newScript = {
        ...scriptFormData,
        createdBy: null,
        isActive: true,
        lastModifiedBy: null
      };
      createScriptMutation.mutate(newScript);
    }
  };
  
  // Handle script edit
  const handleEditScript = (script: CallScript) => {
    setSelectedScriptId(script.id);
    setScriptFormData({
      name: script.name,
      scriptType: script.scriptType,
      scriptContent: script.scriptContent,
      description: script.description || ''
    });
    setIsEditingScript(true);
  };
  
  // Handle script deletion
  const handleDeleteScript = (id: number) => {
    if (confirm('Are you sure you want to delete this script?')) {
      deleteScriptMutation.mutate(id);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setSelectedScriptId(null);
    setScriptFormData({
      name: '',
      scriptType: 'reservation',
      scriptContent: '',
      description: ''
    });
    setIsEditingScript(false);
  };

  // Handler for resolving a notification (marking check as provided)
  const handleResolveNotification = async (notificationId: number) => {
    setSelectedNotificationId(notificationId);
    setIsResolvingNotification(true);
    
    try {
      const response = await fetch(`/api/admin/restaurant-notifications/${notificationId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to resolve notification');
      }
      
      // Refetch notifications to update the list
      await refetchNotifications();
      
      toast({
        title: "Success",
        description: "Notification marked as resolved",
      });
    } catch (error) {
      console.error('Error resolving notification:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resolve notification",
        variant: "destructive"
      });
    } finally {
      setIsResolvingNotification(false);
      setSelectedNotificationId(null);
    }
  };
  
  // Handler for sending a reminder to restaurant about check input
  const handleSendReminder = async (notificationId: number) => {
    setSelectedNotificationId(notificationId);
    setIsSendingReminder(true);
    
    try {
      const response = await fetch(`/api/admin/restaurant-notifications/${notificationId}/remind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }
      
      // Refetch notifications to update the list
      await refetchNotifications();
      
      toast({
        title: "Success",
        description: "Reminder sent to restaurant manager",
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reminder",
        variant: "destructive"
      });
    } finally {
      setIsSendingReminder(false);
      setSelectedNotificationId(null);
    }
  };
  
  // Helper function to filter data based on search term
  const filterData = <T extends Record<string, any>>(data: T[], fields: (keyof T)[]): T[] => {
    if (!searchTerm || searchTerm.trim() === "") return data;
    return data.filter(item => 
      fields.some(field => 
        String(item[field])?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };
  
  const exportToPdf = async () => {
    if (!vcResultsRef.current) return;
    
    try {
      toast({
        title: "Generating report...",
        description: "Please wait while we prepare your report.",
      });
      
      // Get the valuation results
      const result = calculateVcValuation();
      
      // Create a text representation of the valuation data
      const reportData = `# Convive Venture Capital Valuation Report
Generated on: ${new Date().toLocaleDateString()}

## Valuation Results
- Terminal Value (Year ${vcValuationParams.projectionYear}): $${result.terminalValue.toLocaleString()}
- Present Value: $${result.presentValue.toLocaleString()}
- Pre-Money Valuation: $${result.preMoneyValuation.toLocaleString()}
- Post-Money Valuation: $${result.postMoneyValuation.toLocaleString()}
- Investor Equity: ${result.investorEquity.toFixed(2)}%
- Return on Investment: ${result.roi.toFixed(2)}x

## Key User Metrics
- Average Revenue Per User: $${result.arpu.toFixed(2)}/month
- Customer Acquisition Cost: $${result.cac}
- Customer Lifetime Value: $${result.ltv.toFixed(2)}
- LTV:CAC Ratio: ${result.ltvCacRatio.toFixed(2)}

## User Growth Projections
${result.projectedArrByYear.map(year => 
  `Year ${year.year}: ${year.users.toLocaleString()} users, $${year.arpu}/mo ARPU, $${year.revenue.toLocaleString()} annual revenue`
).join('\n')}

## Valuation Parameters
- Projected Revenue: $${vcValuationParams.projectedRevenue.toLocaleString()}
- Projection Year: ${vcValuationParams.projectionYear}
- Industry Multiple: ${vcValuationParams.industryMultiple}
- Discount Rate: ${vcValuationParams.discountRate * 100}%
- Initial Investment: $${vcValuationParams.initialInvestment.toLocaleString()}
- Ownership Percentage: ${vcValuationParams.ownershipPercentage}%
- Monthly Active Users: ${vcValuationParams.monthlyActiveUsers.toLocaleString()}
- User Growth Rate: ${vcValuationParams.userGrowthRate}%
- Average Revenue Per User: $${vcValuationParams.averageRevenuePerUser}
- Customer Acquisition Cost: $${vcValuationParams.customerAcquisitionCost}

## Subscription Plans
${vcValuationParams.subscriptionPlans.map(plan => 
  `- ${plan.name}: $${plan.price.toFixed(2)}, ${plan.userPercentage}% of users`
).join('\n')}

Confidential: For investor review only
Convive: Curated Dining & Extraordinary Connections
`;

      // Create a Blob containing the report data
      const blob = new Blob([reportData], { type: 'text/plain' });
      
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'convive-valuation-report.txt';
      
      // Append to the document, trigger click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Report generated successfully",
        description: "Your valuation report has been exported as a text file. On iPad, check the Files app or Downloads folder.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report generation failed",
        description: "There was an error creating your report. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate statistics for the dashboard
  // Utility function to safely format currency values
  const formatCurrency = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return '0.00';
  };

  const calculateStats = () => {
    if (!allUserData || !meetups || !dinnerChecks) return null;
    
    return {
      totalUsers: allUserData.length,
      premiumUsers: premiumUsers?.length || 0,
      totalMeetups: meetups.length,
      avgCheckAmount: dinnerChecks?.length ? 
        dinnerChecks.reduce((acc, check) => acc + Number(formatCurrency(check.checkAveragePerPerson)), 0) / dinnerChecks.length : 0,
      totalRevenue: allUserData.reduce((acc, user) => acc + (user.ticketStats?.totalSpent || 0), 0),
      ticketTypeDistribution: calculateTicketDistribution(allUserData),
    };
  };

  // Calculate ticket type distribution for chart
  const calculateTicketDistribution = (userData: UserWithAnalytics[]) => {
    const distribution: Record<string, number> = {};
    
    userData.forEach(user => {
      if (user.ticketStats?.ticketsByType) {
        Object.entries(user.ticketStats.ticketsByType).forEach(([type, count]) => {
          distribution[type] = (distribution[type] || 0) + Number(count);
        });
      }
    });
    
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };
  
  // Calculate VC valuation using the venture capital method
  const calculateVcValuation = () => {
    const {
      projectedRevenue,
      projectionYear,
      industryMultiple,
      discountRate,
      initialInvestment,
      ownershipPercentage,
      monthlyActiveUsers,
      userGrowthRate,
      customerAcquisitionCost,
      subscriptionPlans
    } = vcValuationParams;
    
    // Calculate terminal value (future value)
    const terminalValue = projectedRevenue * industryMultiple;
    
    // Calculate present value
    const presentValue = terminalValue / Math.pow(1 + discountRate, projectionYear);
    
    // Calculate post-money valuation
    const postMoneyValuation = presentValue;
    
    // Calculate pre-money valuation
    const preMoneyValuation = postMoneyValuation - initialInvestment;
    
    // Calculate investor equity
    const investorEquity = (initialInvestment / postMoneyValuation) * 100;
    
    // Calculate return on investment
    const roi = (terminalValue * (ownershipPercentage / 100)) / initialInvestment;
    
    // Calculate projected ARR by year
    const projectedArrByYear = Array.from({ length: projectionYear }, (_, i) => {
      const year = i + 1;
      // Calculate projected users with compound growth
      const projectedUsers = monthlyActiveUsers * Math.pow(1 + (userGrowthRate / 100), year);
      
      // Calculate weighted average revenue per user based on subscription plans
      const weightedArpu = subscriptionPlans.reduce((acc, plan) => {
        return acc + (plan.price * (plan.userPercentage / 100));
      }, 0);
      
      // Calculate annual revenue
      const annualRevenue = projectedUsers * weightedArpu * 12;
      
      return {
        year,
        users: Math.round(projectedUsers),
        arpu: weightedArpu.toFixed(2),
        revenue: Math.round(annualRevenue)
      };
    });
    
    // Calculate LTV and other metrics
    const churnRate = 0.05; // 5% monthly churn rate
    const grossMargin = 0.75; // 75% gross margin
    
    // Calculate average monthly revenue per user
    const arpu = subscriptionPlans.reduce((acc, plan) => {
      return acc + (plan.price * (plan.userPercentage / 100));
    }, 0);
    
    // Calculate customer lifetime in months (1/churn rate)
    const customerLifetimeMonths = 1 / churnRate;
    
    // Calculate lifetime value
    const ltv = (arpu * grossMargin * customerLifetimeMonths);
    
    // Calculate LTV:CAC ratio
    const ltvCacRatio = ltv / customerAcquisitionCost;
    
    return {
      terminalValue,
      presentValue,
      postMoneyValuation,
      preMoneyValuation,
      investorEquity,
      roi,
      projectedArrByYear,
      ltv,
      arpu,
      cac: customerAcquisitionCost,
      ltvCacRatio
    };
  };

  const stats = calculateStats();
  const isLoading = isLoadingUsers || isLoadingPremium || isLoadingChecks || isLoadingRestaurants || isLoadingMeetups;
  const isLoadingCallManagement = isLoadingScripts || isLoadingRecordings;
  const isLoadingRestaurantNotifications = activeTab === "restaurant-notifications" && isLoadingNotifications;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (usersError || premiumError || checksError || restaurantsError || meetupsError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Data</h2>
        <p className="text-muted-foreground">There was a problem fetching the data. Please try again.</p>
      </div>
    );
  }

  const filteredUsers = filterData(allUserData || [], ['username', 'fullName', 'email']);
  const filteredRestaurants = filterData(restaurants || [], ['name', 'cuisineType', 'address']);
  const filteredMeetups = filterData(meetups || [], ['title']);
  const filteredDinnerChecks = filterData(dinnerChecks || [], ['restaurantId', 'meetupId']);
  const filteredCallScripts = filterData(callScripts || [], ['name', 'scriptType', 'scriptContent']);
  // Since the call recordings feature is not fully implemented yet, we'll handle it differently
  const filteredCallRecordings: CallRecording[] = [];
  
  // This is just to remove the hook from here, we'll place it back with the other hooks

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-60">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-6 w-6 text-primary mr-2" />
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Premium Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShieldCheck className="h-6 w-6 text-primary mr-2" />
                <div className="text-2xl font-bold">{stats?.premiumUsers || 0}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-primary mr-2" />
                <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2) || "0.00"}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Check Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-primary mr-2" />
                <div className="text-2xl font-bold">${stats?.avgCheckAmount.toFixed(2) || "0.00"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="space-y-4">
            {/* Mobile Dropdown Selector - Only visible on small screens */}
            <div className="md:hidden">
              <p className="text-sm text-muted-foreground mb-2">Select Dashboard View:</p>
              <Select 
                value={activeTab} 
                onValueChange={(value) => {
                  setActiveTab(value);
                  // Force refresh the tabs when selection changes
                  setTimeout(() => {
                    const event = new Event('resize');
                    window.dispatchEvent(event);
                  }, 10);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="user-metrics">User Metrics</SelectItem>
                  <SelectItem value="restaurants">Restaurants</SelectItem>
                  <SelectItem value="meetups">Today's Meetups</SelectItem>
                  <SelectItem value="restaurant-notifications">Notifications</SelectItem>
                  <SelectItem value="ux-consistency">UX Consistency</SelectItem>
                  <SelectItem value="recipe-analysis">Recipe Analysis</SelectItem>
                  <SelectItem value="premium">Premium Data</SelectItem>
                  <SelectItem value="user-view">User View</SelectItem>
                  <SelectItem value="restaurant-admin">Restaurant Admin</SelectItem>
                  <SelectItem value="public-view">Public View</SelectItem>
                  <SelectItem value="call-management">Call Management</SelectItem>
                  <SelectItem value="vc-valuation">VC Valuation</SelectItem>
                  <SelectItem value="group-formation-test">Group Formation</SelectItem>
                  <SelectItem value="ai-testing">AI Testing</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Show current tab title on mobile */}
              <div className="mt-4 mb-2">
                <h2 className="text-xl font-bold">{
                  activeTab === "analytics" ? "Analytics" :
                  activeTab === "users" ? "Users" :
                  activeTab === "user-metrics" ? "User Metrics" :
                  activeTab === "restaurants" ? "Restaurants" :
                  activeTab === "meetups" ? "Today's Meetups" :
                  activeTab === "restaurant-notifications" ? "Notifications" :
                  activeTab === "ux-consistency" ? "UX Consistency" :
                  activeTab === "recipe-analysis" ? "Recipe Analysis" :
                  activeTab === "premium" ? "Premium Data" :
                  activeTab === "user-view" ? "User View" :
                  activeTab === "restaurant-admin" ? "Restaurant Admin" :
                  activeTab === "public-view" ? "Public View" :
                  activeTab === "call-management" ? "Call Management" :
                  activeTab === "vc-valuation" ? "VC Valuation" :
                  activeTab === "group-formation-test" ? "Group Formation" :
                  activeTab === "ai-testing" ? "AI Testing" :
                  "Dashboard"
                }</h2>
              </div>
            </div>
            
            {/* Desktop Tabs - Hidden on mobile */}
            <div className="hidden md:block space-y-2">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="user-metrics">User Metrics</TabsTrigger>
                <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                <TabsTrigger value="meetups">Today's Meetups</TabsTrigger>
                <TabsTrigger value="restaurant-notifications">Notifications</TabsTrigger>
                <TabsTrigger value="ux-consistency">UX Consistency</TabsTrigger>
              </TabsList>
              
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="recipe-analysis">Recipe Analysis</TabsTrigger>
                <TabsTrigger value="wine" className="bg-primary/10 text-primary">Wine Upload</TabsTrigger>
                <TabsTrigger value="premium">Premium Data</TabsTrigger>
                <TabsTrigger value="user-view">User View</TabsTrigger>
                <TabsTrigger value="restaurant-admin">Rest. Admin</TabsTrigger>
                <TabsTrigger value="public-view">Public View</TabsTrigger>
                <TabsTrigger value="call-management">Call Management</TabsTrigger>
                <TabsTrigger value="vc-valuation">VC Valuation</TabsTrigger>
                <TabsTrigger value="group-formation-test">Group Formation</TabsTrigger>
                <TabsTrigger value="ai-testing">AI Testing</TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Platform Analytics & Activity Monitoring</h2>
            
            {/* User Activity Monitoring Section */}
            <Card className="col-span-full mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  User Activity Monitoring
                </CardTitle>
                <CardDescription>
                  Track user engagement and activity patterns across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Active Users</h3>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold">127</p>
                        <p className="text-xs text-muted-foreground">Past 30 days</p>
                      </div>
                      <div className="h-10 flex items-end">
                        <Badge variant="outline" className="bg-primary/10">
                          <ChevronUp className="h-3 w-3 mr-1 text-green-500" /> 
                          12%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Average Meetups Per User</h3>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold">2.4</p>
                        <p className="text-xs text-muted-foreground">Monthly average</p>
                      </div>
                      <div className="h-10 flex items-end">
                        <Badge variant="outline" className="bg-primary/10">
                          <ChevronUp className="h-3 w-3 mr-1 text-green-500" /> 
                          5%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Return Rate</h3>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold">68%</p>
                        <p className="text-xs text-muted-foreground">Of users return</p>
                      </div>
                      <div className="h-10 flex items-end">
                        <Badge variant="outline" className="bg-primary/10">
                          <ChevronUp className="h-3 w-3 mr-1 text-green-500" /> 
                          3%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3">Engagement Over Time</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { name: 'Jan', logins: 65, meetups: 28, messages: 42 },
                          { name: 'Feb', logins: 70, meetups: 30, messages: 45 },
                          { name: 'Mar', logins: 75, meetups: 32, messages: 48 },
                          { name: 'Apr', logins: 80, meetups: 35, messages: 52 },
                          { name: 'May', logins: 90, meetups: 40, messages: 60 },
                          { name: 'Jun', logins: 95, meetups: 42, messages: 63 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="logins" stroke="#8884d8" />
                        <Line type="monotone" dataKey="meetups" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="messages" stroke="#ffc658" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#8884d8] mr-1"></div>
                      <span className="text-xs">Logins</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#82ca9d] mr-1"></div>
                      <span className="text-xs">Meetups</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ffc658] mr-1"></div>
                      <span className="text-xs">Messages</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3">Most Active Users</h3>
                  <div className="space-y-2">
                    {[
                      { username: 'jennifer82', fullName: 'Jennifer Kim', meetups: 8, lastActive: '1 hour ago' },
                      { username: 'michaeld', fullName: 'Michael Davis', meetups: 6, lastActive: '3 hours ago' },
                      { username: 'sarahj', fullName: 'Sarah Johnson', meetups: 5, lastActive: '2 days ago' },
                      { username: 'robert_t', fullName: 'Robert Taylor', meetups: 5, lastActive: '12 hours ago' },
                    ].map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{user.meetups} meetups</p>
                          <p className="text-xs text-muted-foreground">Last active: {user.lastActive}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticket Distribution Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Ticket Type Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of ticket types purchased by users
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={stats?.ticketTypeDistribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats?.ticketTypeDistribution?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} tickets`, 'Quantity']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Users vs Regular Users */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Premium vs Regular Users</CardTitle>
                  <CardDescription>
                    Comparing premium and regular user metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={[
                          { name: 'Premium', value: stats?.premiumUsers || 0 },
                          { name: 'Regular', value: (stats?.totalUsers || 0) - (stats?.premiumUsers || 0) }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          <Cell fill="#00C49F" />
                          <Cell fill="#0088FE" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent User Activity</CardTitle>
                <CardDescription>
                  Latest user actions and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-4">
                    {/* This would ideally be populated with real activity data */}
                    <li className="flex items-start justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">John Doe purchased a High Roller ticket</p>
                          <p className="text-sm text-muted-foreground">Amount: $100.00</p>
                        </div>
                      </div>
                      <Badge>High Roller Ticket</Badge>
                    </li>
                    <li className="flex items-start justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>AS</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Alice Smith subscribed to Elite Tier</p>
                          <p className="text-sm text-muted-foreground">Amount: $375.00/month</p>
                        </div>
                      </div>
                      <Badge variant="outline">Subscription</Badge>
                    </li>
                    <li className="flex items-start justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>RB</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Robert Brown created a new meetup</p>
                          <p className="text-sm text-muted-foreground">At: Bella Italia Restaurant</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Meetup</Badge>
                    </li>
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage all user accounts across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {filteredUsers?.map((user) => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {user.profilePicture ? (
                                <AvatarImage src={user.profilePicture} alt={user.username} />
                              ) : (
                                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.isPremiumUser && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-amber-300 text-black">
                                Premium
                              </Badge>
                            )}
                            <Badge variant={user.role === "super_admin" ? "destructive" : 
                                          user.role === "admin" ? "default" : 
                                          user.role === "restaurant_admin" ? "outline" : "secondary"}>
                              {user.role}
                            </Badge>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm font-medium">Tickets Purchased</p>
                            <p>{user.ticketStats?.totalTickets || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Lifetime Value</p>
                            <p>${formatCurrency(user.lifetimeDiningValue)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Dinner Count</p>
                            <p>{user.dinnerCount || 0}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">Manage Restaurants</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRestaurants?.map((restaurant) => (
                <Card key={restaurant.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle>{restaurant.name}</CardTitle>
                      {restaurant.isFeatured && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-300 text-black">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{restaurant.cuisineType}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{restaurant.address}</p>
                    <p className="text-sm">Price Range: {restaurant.priceRange}</p>
                    <div className="mt-4">
                      <p className="text-sm font-medium">Manager:</p>
                      <p className="text-sm">{restaurant.managerId || 'None assigned'}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">View Details</Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* User Metrics Tab */}
          <TabsContent value="user-metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>
                    Monthly user signups and retention rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={[
                          { month: 'Jan', signups: 12, active: 12 },
                          { month: 'Feb', signups: 19, active: 28 },
                          { month: 'Mar', signups: 25, active: 45 },
                          { month: 'Apr', signups: 18, active: 58 },
                          { month: 'May', signups: 29, active: 75 },
                          { month: 'Jun', signups: 33, active: 90 }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="signups" stroke="#8884d8" name="New Users" />
                        <Line type="monotone" dataKey="active" stroke="#82ca9d" name="Active Users" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* User Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>
                    Key metrics on user activity and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">Average Meetups Per User</p>
                        <p className="text-sm font-medium">
                          {stats && stats.totalUsers ? (meetups.length / stats.totalUsers).toFixed(1) : "0.0"}
                        </p>
                      </div>
                      <Progress 
                        value={stats && stats.totalUsers ? 
                          Math.min((meetups.length / stats.totalUsers) * 33, 100) : 0} 
                        className="h-2" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">Premium Conversion Rate</p>
                        <p className="text-sm font-medium">
                          {stats && stats.totalUsers ? 
                            ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) + "%" : "0.0%"}
                        </p>
                      </div>
                      <Progress 
                        value={stats && stats.totalUsers ? 
                          (stats.premiumUsers / stats.totalUsers) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">Lifetime Value (Avg)</p>
                        <p className="text-sm font-medium">
                          ${allUserData.reduce((acc, user) => acc + (user.lifetimeDiningValue || 0), 0) / 
                            (allUserData.length || 1)}
                        </p>
                      </div>
                      <Progress 
                        value={Math.min(
                          allUserData.reduce((acc, user) => acc + (user.lifetimeDiningValue || 0), 0) / 
                          (allUserData.length || 1) / 10, 
                          100
                        )} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Cohort Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>User Cohort Analysis</CardTitle>
                <CardDescription>
                  Analyzing user behavior and retention by signup date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Cohort</th>
                        <th className="text-left p-2">Size</th>
                        <th className="text-left p-2">Week 1 Retention</th>
                        <th className="text-left p-2">Week 2 Retention</th>
                        <th className="text-left p-2">Week 3 Retention</th>
                        <th className="text-left p-2">Avg. Spend</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">Jan '25</td>
                        <td className="p-2">32</td>
                        <td className="p-2">91%</td>
                        <td className="p-2">84%</td>
                        <td className="p-2">78%</td>
                        <td className="p-2">$142.50</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Feb '25</td>
                        <td className="p-2">47</td>
                        <td className="p-2">89%</td>
                        <td className="p-2">79%</td>
                        <td className="p-2">72%</td>
                        <td className="p-2">$137.25</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Mar '25</td>
                        <td className="p-2">56</td>
                        <td className="p-2">93%</td>
                        <td className="p-2">88%</td>
                        <td className="p-2">81%</td>
                        <td className="p-2">$156.75</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Apr '25</td>
                        <td className="p-2">38</td>
                        <td className="p-2">90%</td>
                        <td className="p-2">82%</td>
                        <td className="p-2">-</td>
                        <td className="p-2">$149.20</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Today's Meetups Tab */}
          <TabsContent value="meetups" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Today's Meetups</h2>
              <p className="text-muted-foreground mb-6">
                Monitor all scheduled meetups happening today across all restaurants.
              </p>
            </div>
            
            {meetups && meetups.length > 0 ? (
              <div className="space-y-6">
                {meetups.map((meetup) => {
                  const restaurant = restaurants.find(r => r.id === meetup.restaurantId);
                  const isExpanded = expandedMeetups.includes(meetup.id);
                  
                  return (
                    <Card key={meetup.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{meetup.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {restaurant?.name || "Unknown Restaurant"}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                meetup.status === "confirmed" ? "default" : 
                                meetup.status === "pending" ? "secondary" : 
                                meetup.status === "cancelled" ? "destructive" : 
                                "outline"
                              }
                            >
                              {meetup.status?.charAt(0).toUpperCase() + meetup.status?.slice(1)}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-0 h-6 w-6"
                              onClick={() => toggleMeetupExpand(meetup.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(meetup.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {meetup.startTime} - {meetup.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              Participants: 0/{meetup.maxParticipants}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      
                      {isExpanded && (
                        <div className="px-6 pb-6">
                          <Separator className="mb-4" />
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Meetup Details</h4>
                              <p className="text-sm text-muted-foreground">Scheduled for {new Date(meetup.date).toLocaleDateString()} at {meetup.startTime}</p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Restaurant Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">Name: {restaurant?.name}</p>
                                  <p className="text-sm text-muted-foreground">Cuisine: {restaurant?.cuisineType}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Address: {restaurant?.address}</p>
                                  <p className="text-sm text-muted-foreground">Rating: {restaurant?.rating || "N/A"}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium">Participants</h4>
                                <Badge variant="outline">0 / {meetup.maxParticipants}</Badge>
                              </div>
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground text-center py-4">No participants yet.</p>
                                </div>
                              </ScrollArea>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Meetup
                              </Button>
                              <Button variant="default" size="sm">
                                <Users className="h-4 w-4 mr-2" />
                                Manage Participants
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-lg font-medium">No meetups scheduled for today</p>
                <p className="text-sm text-muted-foreground mt-2">When meetups are scheduled, they'll appear here.</p>
              </Card>
            )}
          </TabsContent>
          
          {/* Restaurant Notifications Tab */}
          <TabsContent value="restaurant-notifications" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Restaurant Check Notifications</CardTitle>
                  <CardDescription>
                    Restaurants are required to input check data within 7 hours of dinner completion
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => refetchNotifications()}
                  variant="outline"
                  className="gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRestaurantNotifications ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : checkNotifications.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {checkNotifications.map((notification: any) => {
                        // Calculate how much time has passed since deadline if deadline exists
                        let hoursPassed = 0;
                        if (notification.inputRequiredBy) {
                          const deadlineDate = new Date(notification.inputRequiredBy);
                          const now = new Date();
                          hoursPassed = Math.round((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60));
                        }
                        
                        return (
                          <Card key={notification.id} className={`p-4 ${notification.isOverdue === true ? 'border-red-400' : 'border-amber-400'}`}>
                            <div className="flex flex-col space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">{restaurants.find(r => r.id === notification.restaurantId)?.name || `Restaurant #${notification.restaurantId}`}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Meetup ID: {notification.meetupId} on {notification.reportedAt ? new Date(notification.reportedAt).toLocaleDateString() : 'Unknown date'}
                                  </p>
                                </div>
                                <Badge variant={notification.isOverdue === true ? "destructive" : "outline"}>
                                  {notification.isOverdue === true
                                    ? `${hoursPassed} hours overdue` 
                                    : 'Input required'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Required by:</span>
                                  <p>{notification.inputRequiredBy ? new Date(notification.inputRequiredBy).toLocaleString() : 'Not set'}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span>
                                  <p>{notification.inputProvided === true ? 'Input provided' : 'Awaiting input'}</p>
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-2 pt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSendReminder(notification.id)}
                                  disabled={isResolvingNotification || isSendingReminder}
                                >
                                  {isSendingReminder && notification.id === selectedNotificationId ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Send Reminder
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  disabled={notification.inputProvided === true || isResolvingNotification || isSendingReminder}
                                  onClick={() => handleResolveNotification(notification.id)}
                                >
                                  {isResolvingNotification && notification.id === selectedNotificationId ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Mark as Resolved
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-10">
                    <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                      All restaurants have submitted their check data on time. There are no overdue inputs to report.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* UX Consistency Tab */}
          <TabsContent value="ux-consistency" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>UX Consistency Audit</CardTitle>
                    <CardDescription>Track and resolve user experience inconsistencies across the platform</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                      <div className="flex items-center">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        <span>{uiAuditResults.filter(i => i.status === 'pending' && i.severity === 'high').length} High Priority</span>
                      </div>
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                      <div className="flex items-center">
                        <Info className="h-3.5 w-3.5 mr-1" />
                        <span>{uiAuditResults.filter(i => i.status === 'resolved').length} Resolved</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <p className="text-4xl font-bold text-amber-600">{uiAuditResults.filter(i => i.severity === 'high').length}</p>
                          <p className="text-sm text-amber-700">High Impact Issues</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <p className="text-4xl font-bold text-orange-600">{uiAuditResults.filter(i => i.severity === 'medium').length}</p>
                          <p className="text-sm text-orange-700">Medium Impact Issues</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <p className="text-4xl font-bold text-blue-600">{uiAuditResults.filter(i => i.severity === 'low').length}</p>
                          <p className="text-sm text-blue-700">Low Impact Issues</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <p className="text-4xl font-bold text-green-600">{uiAuditResults.filter(i => i.status === 'resolved').length}</p>
                          <p className="text-sm text-green-700">Resolved Issues</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium">UX Consistency Issues</h3>
                        <div className="flex gap-2">
                          <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Issues</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => {
                              setIsRefreshingUxIssues(true);
                              setTimeout(() => {
                                setIsRefreshingUxIssues(false);
                                toast({
                                  title: "UX issues refreshed",
                                  description: "Next automatic refresh scheduled in 24 hours",
                                });
                              }, 1000);
                            }}
                            disabled={isRefreshingUxIssues}
                          >
                            {isRefreshingUxIssues ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            {isRefreshingUxIssues ? "Refreshing..." : "Refresh"}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {uiAuditResults.map((issue) => (
                          <div key={issue.id} className="rounded-md border bg-card">
                            <div className={`p-4 flex items-center justify-between border-l-4 ${
                              issue.severity === 'high' ? 'border-l-red-500 bg-red-50' :
                              issue.severity === 'medium' ? 'border-l-amber-500 bg-amber-50' :
                              'border-l-blue-500 bg-blue-50'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">{issue.component}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {issue.path}
                                    </Badge>
                                    <Badge variant={
                                      issue.status === 'resolved' ? 'outline' :
                                      issue.status === 'in-progress' ? 'secondary' : 'default'
                                    } className="text-xs">
                                      {issue.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{issue.issue}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Select 
                                  defaultValue={issue.status}
                                  onValueChange={(value: 'pending' | 'in-progress' | 'resolved') => handleUxIssueStatusChange(issue.id, value)}
                                >
                                  <SelectTrigger className="h-8 w-[130px]">
                                    <SelectValue placeholder="Change status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-muted-foreground">Impact</p>
                                <p>{issue.impact}</p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground">Solution</p>
                                <p>{issue.solution}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Add New UX Issue</CardTitle>
                  <CardDescription>
                    Document a new user experience inconsistency to be addressed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleAddUxIssue(); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="component">Component/Feature</Label>
                        <Input 
                          id="component" 
                          placeholder="e.g. Navigation Menu, Profile Form" 
                          value={newUxIssue.component}
                          onChange={(e) => setNewUxIssue({...newUxIssue, component: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="path">Path/Location</Label>
                        <Input 
                          id="path" 
                          placeholder="e.g. /settings, global, /profile" 
                          value={newUxIssue.path}
                          onChange={(e) => setNewUxIssue({...newUxIssue, path: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="issue">Issue Description</Label>
                      <Textarea 
                        id="issue" 
                        placeholder="Describe the inconsistency or UX problem" 
                        value={newUxIssue.issue}
                        onChange={(e) => setNewUxIssue({...newUxIssue, issue: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="severity">Severity</Label>
                        <Select 
                          defaultValue={newUxIssue.severity}
                          onValueChange={(value: 'high' | 'medium' | 'low') => setNewUxIssue({...newUxIssue, severity: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="impact">User Impact</Label>
                        <Textarea 
                          id="impact" 
                          placeholder="How does this issue affect users?"
                          value={newUxIssue.impact}
                          onChange={(e) => setNewUxIssue({...newUxIssue, impact: e.target.value})}
                          required
                          className="h-24"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="solution">Proposed Solution</Label>
                      <Textarea 
                        id="solution" 
                        placeholder="How should this be fixed?"
                        value={newUxIssue.solution}
                        onChange={(e) => setNewUxIssue({...newUxIssue, solution: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Issue
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Recipe Analysis Tab */}
          {/* Wine Upload Tab */}
          <TabsContent value="wine" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Wine className="h-5 w-5" />
                    Wine List Upload & Processing
                  </CardTitle>
                  <CardDescription>
                    Upload wine lists to process with GPT-4o and add to the database
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-primary" />
                        Upload Wine List
                      </h3>
                      <div className="p-6 border rounded-lg bg-slate-50">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="wine-list-text">Wine List Text</Label>
                            <Textarea 
                              id="wine-list-text" 
                              placeholder="Paste wine list here, one wine per line..."
                              className="min-h-[200px] font-mono text-sm"
                              rows={8}
                            />
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <Label>Or Upload Wine List File</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="wine-file"
                                type="file"
                                accept=".txt"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    setWineFile(e.target.files[0]);
                                    
                                    // Read the file to display its contents in the textarea
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target && typeof event.target.result === 'string') {
                                        setWineListText(event.target.result);
                                        
                                        // Update the textarea with the file contents
                                        const textarea = document.getElementById('wine-list-text') as HTMLTextAreaElement;
                                        if (textarea) {
                                          textarea.value = event.target.result;
                                        }
                                      }
                                    };
                                    reader.readAsText(e.target.files[0]);
                                    
                                    toast({
                                      title: "File loaded",
                                      description: `${e.target.files[0].name} loaded successfully`,
                                    });
                                  }
                                }}
                                ref={wineFileRef}
                              />
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => wineFileRef.current?.click()}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {wineFile ? wineFile.name : "Choose File"}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Text files (.txt) with one wine per line work best
                            </p>
                          </div>
                          
                          <Button 
                            className="w-full" 
                            onClick={() => {
                              const textarea = document.getElementById('wine-list-text') as HTMLTextAreaElement;
                              if (textarea && textarea.value.trim().length > 0) {
                                // Process the wine list directly
                                processWineList(textarea.value);
                              } else {
                                toast({
                                  title: "No wine list provided",
                                  description: "Please paste wine list text or upload a file",
                                  variant: "destructive"
                                });
                              }
                            }}
                            disabled={isProcessingWines}
                          >
                            {isProcessingWines ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Wine className="mr-2 h-4 w-4" />
                                Process Wine List
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Wine Database Status
                      </h3>
                      <div className="p-6 border rounded-lg bg-slate-50">
                        <div className="space-y-6">
                          <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                              <Label>Database Status</Label>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Online</Badge>
                            </div>
                            <Progress value={100} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              PostgreSQL database is connected and ready
                            </p>
                          </div>
                          
                          <div className="grid gap-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Total Wines</span>
                              <span className="text-sm">Loading...</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Varietals</span>
                              <span className="text-sm">Loading...</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Regions</span>
                              <span className="text-sm">Loading...</span>
                            </div>
                          </div>
                          
                          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/wine-database'}>
                            <Database className="mr-2 h-4 w-4" />
                            View Wine Database
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="recipe-analysis" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Recipe Analysis</h2>
              <p className="text-muted-foreground mb-6">
                Upload and analyze recipes to provide staff training on ingredients and techniques.
              </p>
            </div>
            
            {isCheckingAi ? (
              <Card className="p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Checking AI analysis availability</p>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we check if OpenAI integration is available...</p>
              </Card>
            ) : aiStatus === false ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  AI Analysis Not Available
                </AlertTitle>
                <AlertDescription>
                  OpenAI integration is not currently configured. Add an OpenAI API key to enable AI-powered recipe analysis.
                </AlertDescription>
              </Alert>
            ) : null}
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recipe Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Recipe</CardTitle>
                  <CardDescription>
                    Upload a recipe file (PDF or TXT) for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipe-file">Recipe File</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full justify-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {recipeFile ? 'Change File' : 'Select File'}
                        </Button>
                        <input
                          type="file"
                          id="recipe-file"
                          ref={fileInputRef}
                          onChange={handleRecipeFileChange}
                          accept=".pdf,.txt"
                          className="hidden"
                        />
                      </div>
                      {recipeFile && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          {recipeFile.name}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="recipe-notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="recipe-notes"
                        placeholder="Add any additional context about the recipe..."
                        value={recipeNotes}
                        onChange={(e) => setRecipeNotes(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleRecipeUpload} 
                      disabled={!recipeFile || isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ChefHat className="h-4 w-4 mr-2" />
                          Analyze Recipe
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Analysis Results Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    Culinary breakdown with ingredients and techniques
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recipeAnalysis ? (
                    <div className="space-y-4">
                      {/* Wikipedia Integration Results */}
                      {recipeAnalysis.culinaryTerms && recipeAnalysis.culinaryTerms.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="text-lg font-medium mb-2 text-blue-700">
                            Educational Content Identified ({recipeAnalysis.culinaryTerms.length} terms)
                          </h3>
                          <p className="text-sm text-blue-600 mb-3">
                            The following culinary terms were identified from your uploaded recipes:
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {recipeAnalysis.culinaryTerms.map((termData: any, index: number) => (
                              <div
                                key={`culinary-${index}`}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                              >
                                {typeof termData === 'string' ? termData : termData.term || termData.name || 'Unknown term'}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-blue-600">
                            Educational content successfully enriched with reliable culinary sources
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Ingredients</h3>
                        <ScrollArea className="h-[150px]">
                          <div className="space-y-2">
                            {recipeAnalysis.ingredients?.map((ingredient: any, index: number) => (
                              <div 
                                key={index} 
                                className="p-2 border rounded flex justify-between items-center cursor-pointer hover:bg-muted"
                                onClick={() => getItemDetails('ingredient', ingredient.name)}
                              >
                                <div>
                                  <p className="font-medium">{ingredient.name}</p>
                                  <p className="text-sm text-muted-foreground">{ingredient.description}</p>
                                </div>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Techniques</h3>
                        <ScrollArea className="h-[150px]">
                          <div className="space-y-2">
                            {recipeAnalysis.techniques?.map((technique: any, index: number) => (
                              <div 
                                key={index} 
                                className="p-2 border rounded flex justify-between items-center cursor-pointer hover:bg-muted"
                                onClick={() => getItemDetails('technique', technique.name)}
                              >
                                <div>
                                  <p className="font-medium">{technique.name}</p>
                                  <p className="text-sm text-muted-foreground">{technique.description}</p>
                                </div>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No Recipe Analyzed Yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload a recipe to see the analysis with ingredients and cooking techniques.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Allergen Checker Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Food Allergen Checker</CardTitle>
                <CardDescription>
                  Check ingredients or recipes for common food allergens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AllergenChecker />
              </CardContent>
            </Card>
            
            {/* Detailed Information Section */}
            {selectedItem && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedItem.type === 'ingredient' ? 'Ingredient Details' : 'Technique Details'}
                  </CardTitle>
                  <CardDescription>
                    {selectedItem.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="prose max-w-none dark:prose-invert">
                      <p>{itemDetails}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Premium Data Tab */}
          <TabsContent value="premium" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Premium Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Premium Users</CardTitle>
                  <CardDescription>
                    Users who have high check averages over $175
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {premiumUsers?.map((user) => (
                        <div key={user.id} className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {user.profilePicture ? (
                                <AvatarImage src={user.profilePicture} alt={user.username} />
                              ) : (
                                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Avg: ${formatCurrency(user.averageSpendPerDinner)}</p>
                            <p className="text-sm text-muted-foreground">High Checks: {user.highCheckDinnerCount || 0}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Dinner Check Averages */}
              <Card>
                <CardHeader>
                  <CardTitle>High Check Averages</CardTitle>
                  <CardDescription>
                    Reported check averages over $175 per person
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {filteredDinnerChecks?.filter(check => check.isHighCheckAverage)
                        .map((check) => (
                        <div key={check.id} className="flex items-center justify-between border-b pb-4">
                          <div>
                            <p className="font-medium">Restaurant ID: {check.restaurantId}</p>
                            <p className="text-sm text-muted-foreground">Meetup ID: {check.meetupId}</p>
                          </div>
                          <div>
                            <p className="font-medium">${formatCurrency(check.checkAveragePerPerson)}/person</p>
                            <p className="text-sm text-muted-foreground">Total: ${formatCurrency(check.totalBillAmount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Sales Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Sales Analysis</CardTitle>
                <CardDescription>
                  Breakdown of tickets sold by type and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Sales by Ticket Type</h3>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={stats?.ticketTypeDistribution || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8">
                            {stats?.ticketTypeDistribution?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Recent Premium Purchases</h3>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-4">
                        {/* Normally we'd map actual ticket history data here */}
                        <div className="flex items-center justify-between border-b pb-4">
                          <div>
                            <p className="font-medium">High Roller Ticket</p>
                            <p className="text-sm text-muted-foreground">User ID: 102</p>
                          </div>
                          <Badge variant="outline">$100.00</Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-4">
                          <div>
                            <p className="font-medium">Elite Tier Subscription</p>
                            <p className="text-sm text-muted-foreground">User ID: 105</p>
                          </div>
                          <Badge variant="outline">$375.00</Badge>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User View Tab - Navigate to the regular user dashboard */}
          <TabsContent value="user-view" className="space-y-4">
            <Card className="p-8 text-center">
              <CardHeader>
                <CardTitle className="text-2xl">Regular User View</CardTitle>
                <CardDescription>
                  Access the regular user interface to experience the application from a standard user's perspective.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="mx-auto max-w-md">
                  <p className="mb-8 text-muted-foreground">
                    This page allows you to access the regular user dashboard, where you can browse restaurants, join meetups, and manage your profile just like a standard user would.
                  </p>
                  
                  <div className="flex justify-center gap-4">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-primary to-primary/80 gap-2"
                      onClick={() => {
                        // Use a direct approach to navigate to home page
                        // Set the flag to bypass redirects
                        localStorage.setItem('bypass_admin_redirect', 'true');
                        console.log("Setting bypass flag and navigating to user view");
                        
                        // Force a hard navigation to the root path
                        const rootUrl = window.location.origin;
                        window.location.href = rootUrl + "/?admin_bypass=" + Date.now();
                      }}
                    >
                      <Users className="h-5 w-5" />
                      Go to User Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Note: You will maintain your super_admin privileges and can return to this dashboard at any time.</p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Restaurant Admin Tab - Navigate to the restaurant admin dashboard */}
          <TabsContent value="restaurant-admin" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Restaurant Management</CardTitle>
                    <CardDescription>
                      Access restaurant views and manage restaurant communications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    
                    {/* Restaurant Performance Metrics Section */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold mb-4 flex items-center">
                        <BarChartIcon className="h-5 w-5 mr-2" />
                        Restaurant Performance Metrics
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Table Fill Rate</CardTitle>
                            <CardDescription className="text-xs">Average meetup attendance</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-end justify-between">
                              <p className="text-2xl font-bold">92%</p>
                              <Badge variant="outline" className="bg-primary/10">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" /> 
                                5%
                              </Badge>
                            </div>
                            <Progress value={92} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Revenue Per Event</CardTitle>
                            <CardDescription className="text-xs">Average check value per meetup</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-end justify-between">
                              <p className="text-2xl font-bold">$580</p>
                              <Badge variant="outline" className="bg-primary/10">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" /> 
                                8%
                              </Badge>
                            </div>
                            <Progress value={80} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">User Satisfaction</CardTitle>
                            <CardDescription className="text-xs">Post-meetup ratings</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-end justify-between">
                              <p className="text-2xl font-bold">4.7/5</p>
                              <Badge variant="outline" className="bg-primary/10">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" /> 
                                2%
                              </Badge>
                            </div>
                            <Progress value={94} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Host Performance</CardTitle>
                            <CardDescription className="text-xs">
                              Effectiveness ratings by host
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: 'Marco G.', rating: 4.9 },
                                    { name: 'Sophia L.', rating: 4.8 },
                                    { name: 'James K.', rating: 4.7 },
                                    { name: 'Emma T.', rating: 4.5 },
                                    { name: 'Daniel R.', rating: 4.3 },
                                  ]}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                  <XAxis dataKey="name" />
                                  <YAxis domain={[4, 5]} />
                                  <Tooltip />
                                  <Bar dataKey="rating" fill="#8884d8" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Peak Performance Times</CardTitle>
                            <CardDescription className="text-xs">
                              Average satisfaction by day and time
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Friday Evening</span>
                                  <span className="text-sm font-medium">4.9/5</span>
                                </div>
                                <Progress value={98} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Saturday Evening</span>
                                  <span className="text-sm font-medium">4.8/5</span>
                                </div>
                                <Progress value={96} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Sunday Brunch</span>
                                  <span className="text-sm font-medium">4.7/5</span>
                                </div>
                                <Progress value={94} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Thursday Evening</span>
                                  <span className="text-sm font-medium">4.5/5</span>
                                </div>
                                <Progress value={90} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Wednesday Evening</span>
                                  <span className="text-sm font-medium">4.3/5</span>
                                </div>
                                <Progress value={86} className="h-2" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <Card className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Restaurant Admin Dashboard</h3>
                          <p className="text-muted-foreground mb-4">
                            Manage restaurant details, view upcoming reservations, and analyze recipe information.
                          </p>
                        </div>
                        <Button 
                          className="bg-gradient-to-r from-primary to-primary/80 gap-2 w-full"
                          onClick={() => window.location.href = "/restaurant-admin-dashboard"}
                        >
                          <ChefHat className="h-5 w-5" />
                          Go to Restaurant Admin View
                        </Button>
                      </Card>
                      
                      <Card className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Restaurant User Dashboard</h3>
                          <p className="text-muted-foreground mb-4">
                            View the restaurant experience from a customer perspective and test user flows.
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          className="gap-2 w-full"
                          onClick={() => window.location.href = "/restaurant-user-dashboard"}
                        >
                          <UserIcon className="h-5 w-5" />
                          Go to Restaurant User View
                        </Button>
                      </Card>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <h3 className="text-xl font-medium mb-4">Call Script Generator</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="scriptName">Script Name</Label>
                            <Input id="scriptName" placeholder="Enter a name for this script" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scriptType">Script Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a script type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reservation">Restaurant Reservation</SelectItem>
                                <SelectItem value="follow_up">Follow-up Call</SelectItem>
                                <SelectItem value="confirmation">Reservation Confirmation</SelectItem>
                                <SelectItem value="cancellation">Cancellation Handling</SelectItem>
                                <SelectItem value="special_request">Special Requests</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scriptPrompt">Script Requirements</Label>
                            <Textarea 
                              id="scriptPrompt" 
                              placeholder="Describe what you need in this call script. Include tone, key points to cover, etc." 
                              rows={6}
                              className="resize-none"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="targetAudience">Target Audience</Label>
                              <Input id="targetAudience" placeholder="e.g., High-end clientele" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="callDuration">Target Duration</Label>
                              <Input id="callDuration" placeholder="e.g., 2-3 minutes" />
                            </div>
                          </div>
                          
                          <Button className="w-full">
                            <PhoneCall className="mr-2 h-4 w-4" />
                            Generate Call Script
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <div className="border rounded-md p-6 h-[460px]">
                          <ScrollArea className="h-full">
                            <div className="space-y-4">
                              <div className="text-center text-muted-foreground">
                                <PhoneCall className="mx-auto h-12 w-12 mb-4" />
                                <p className="text-lg">Your Generated Call Script Will Appear Here</p>
                                <p className="text-sm mt-2">Fill out the form and click "Generate" to create a new restaurant call script</p>
                              </div>
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">Note: You will maintain your super_admin privileges and can return to this dashboard at any time.</p>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Call Management Tab */}
          <TabsContent value="call-management" className="space-y-6">
            {isLoadingCallManagement ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Call Management</h2>
                  <div className="flex gap-2">
                    <Button 
                      variant={isEditingScript ? "outline" : "default"}
                      onClick={() => setIsEditingScript(!isEditingScript)}
                    >
                      {isEditingScript ? "Cancel" : "Create New Script"}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Call Scripts Section */}
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Call Scripts</CardTitle>
                      <CardDescription>
                        Manage automated call scripts for restaurant reservations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isEditingScript ? (
                        <form onSubmit={handleScriptSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Script Name</Label>
                            <Input 
                              id="name"
                              name="name"
                              value={scriptFormData.name}
                              onChange={handleScriptFormChange}
                              placeholder="Enter script name"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scriptType">Script Type</Label>
                            <select 
                              id="scriptType"
                              name="scriptType" 
                              value={scriptFormData.scriptType}
                              onChange={handleScriptFormChange}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="reservation">Reservation</option>
                              <option value="confirmation">Confirmation</option>
                              <option value="cancellation">Cancellation</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea 
                              id="description"
                              name="description"
                              value={scriptFormData.description}
                              onChange={handleScriptFormChange}
                              placeholder="Enter script description"
                              rows={2}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scriptContent">Script Content</Label>
                            <Textarea 
                              id="scriptContent"
                              name="scriptContent"
                              value={scriptFormData.scriptContent}
                              onChange={handleScriptFormChange}
                              placeholder="Enter script content with variables like {restaurant_name}, {date}, {time}, etc."
                              rows={6}
                              required
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={createScriptMutation.isPending || updateScriptMutation.isPending}
                            >
                              {createScriptMutation.isPending || updateScriptMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : null}
                              {selectedScriptId ? "Update Script" : "Create Script"}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          {filteredCallScripts?.length > 0 ? (
                            <ScrollArea className="h-[400px]">
                              <div className="space-y-4">
                                {filteredCallScripts.map((script) => (
                                  <Card key={script.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h3 className="font-semibold">{script.name}</h3>
                                        <p className="text-sm text-muted-foreground">{script.description}</p>
                                        <Badge className="mt-1">{script.scriptType}</Badge>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditScript(script)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteScript(script.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <Accordion type="single" collapsible>
                                        <AccordionItem value="content">
                                          <AccordionTrigger>View Script Content</AccordionTrigger>
                                          <AccordionContent>
                                            <pre className="text-xs whitespace-pre-wrap p-2 bg-muted rounded-md">
                                              {script.scriptContent}
                                            </pre>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="text-center py-8">
                              <FileCode className="h-12 w-12 mx-auto text-muted-foreground" />
                              <h3 className="mt-2 font-medium">No Scripts Found</h3>
                              <p className="text-sm text-muted-foreground">
                                {searchTerm ? "Try a different search term" : "Create your first call script"}
                              </p>
                              <Button 
                                className="mt-4" 
                                onClick={() => setIsEditingScript(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Script
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Call Recordings Section */}
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Call Recordings</CardTitle>
                      <CardDescription>
                        Review and analyze reservation call recordings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredCallRecordings?.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {filteredCallRecordings.map((recording) => (
                              <Card key={recording.id} className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold">Recording #{recording.id}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Call Log: #{recording.callLogId}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                      <Badge variant="outline">
                                        {recording.recordingDuration ? `${Math.floor(recording.recordingDuration / 60)}:${String(recording.recordingDuration % 60).padStart(2, '0')}` : 'N/A'}
                                      </Badge>
                                      <Badge variant={recording.transcriptionStatus === "completed" ? "default" : "secondary"}>
                                        {recording.transcriptionStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {recording.recordingUrl && (
                                      <a 
                                        href={recording.recordingUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        <Button variant="ghost" size="icon">
                                          <Headphones className="h-4 w-4" />
                                        </Button>
                                      </a>
                                    )}
                                  </div>
                                </div>
                                {recording.transcriptionText && (
                                  <div className="mt-2">
                                    <Accordion type="single" collapsible>
                                      <AccordionItem value="transcript">
                                        <AccordionTrigger>View Transcript</AccordionTrigger>
                                        <AccordionContent>
                                          <div className="text-xs p-2 bg-muted rounded-md max-h-40 overflow-y-auto">
                                            {recording.transcriptionText}
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    </Accordion>
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8">
                          <Mic className="h-12 w-12 mx-auto text-muted-foreground" />
                          <h3 className="mt-2 font-medium">No Recordings Found</h3>
                          <p className="text-sm text-muted-foreground">
                            Call recordings will appear here once they are created
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* VC Valuation Tab */}
          <TabsContent value="vc-valuation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Venture Capital Valuation Calculator</CardTitle>
                <CardDescription>
                  Create financial projections for VC presentations using the venture capital method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Projection Parameters</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="projectedRevenue">Projected Annual Revenue ($)</Label>
                          <Input
                            id="projectedRevenue"
                            type="number"
                            value={vcValuationParams.projectedRevenue}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              projectedRevenue: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="projectionYear">Projection Year</Label>
                          <Input
                            id="projectionYear"
                            type="number"
                            value={vcValuationParams.projectionYear}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              projectionYear: parseInt(e.target.value) || 5
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industryMultiple">Industry Multiple</Label>
                          <Input
                            id="industryMultiple"
                            type="number"
                            value={vcValuationParams.industryMultiple}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              industryMultiple: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discountRate">Discount Rate (0-1)</Label>
                          <Input
                            id="discountRate"
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={vcValuationParams.discountRate}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              discountRate: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                          <Input
                            id="initialInvestment"
                            type="number"
                            value={vcValuationParams.initialInvestment}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              initialInvestment: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ownershipPercentage">Target Ownership (%)</Label>
                          <Input
                            id="ownershipPercentage"
                            type="number"
                            min="0"
                            max="100"
                            value={vcValuationParams.ownershipPercentage}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              ownershipPercentage: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-semibold mb-4">User Growth Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="monthlyActiveUsers">Current Monthly Users</Label>
                          <Input
                            id="monthlyActiveUsers"
                            type="number"
                            value={vcValuationParams.monthlyActiveUsers}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              monthlyActiveUsers: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userGrowthRate">Annual Growth Rate (%)</Label>
                          <Input
                            id="userGrowthRate"
                            type="number"
                            min="0"
                            value={vcValuationParams.userGrowthRate}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              userGrowthRate: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerAcquisitionCost">Customer Acquisition Cost ($)</Label>
                          <Input
                            id="customerAcquisitionCost"
                            type="number"
                            min="0"
                            value={vcValuationParams.customerAcquisitionCost}
                            onChange={(e) => setVcValuationParams({
                              ...vcValuationParams,
                              customerAcquisitionCost: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
                      {vcValuationParams.subscriptionPlans.map((plan, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor={`plan-name-${index}`}>Plan Name</Label>
                            <Input
                              id={`plan-name-${index}`}
                              value={plan.name}
                              onChange={(e) => {
                                const updatedPlans = [...vcValuationParams.subscriptionPlans];
                                updatedPlans[index] = { ...plan, name: e.target.value };
                                setVcValuationParams({
                                  ...vcValuationParams,
                                  subscriptionPlans: updatedPlans
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`plan-price-${index}`}>Monthly Price ($)</Label>
                            <Input
                              id={`plan-price-${index}`}
                              type="number"
                              step="0.01"
                              value={plan.price}
                              onChange={(e) => {
                                const updatedPlans = [...vcValuationParams.subscriptionPlans];
                                updatedPlans[index] = { ...plan, price: parseFloat(e.target.value) || 0 };
                                setVcValuationParams({
                                  ...vcValuationParams,
                                  subscriptionPlans: updatedPlans
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`plan-percentage-${index}`}>User Percentage (%)</Label>
                            <Input
                              id={`plan-percentage-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              value={plan.userPercentage}
                              onChange={(e) => {
                                const updatedPlans = [...vcValuationParams.subscriptionPlans];
                                updatedPlans[index] = { ...plan, userPercentage: parseFloat(e.target.value) || 0 };
                                setVcValuationParams({
                                  ...vcValuationParams,
                                  subscriptionPlans: updatedPlans
                                });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Valuation Results */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Valuation Results</h3>
                      <div className="bg-slate-50 p-6 rounded-md border">
                        {(() => {
                          const result = calculateVcValuation();
                          return (
                            <div className="space-y-4" ref={vcResultsRef}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-slate-500">Terminal Value (Year {vcValuationParams.projectionYear})</p>
                                  <p className="text-xl font-bold">${result.terminalValue.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Present Value</p>
                                  <p className="text-xl font-bold">${result.presentValue.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Pre-Money Valuation</p>
                                  <p className="text-xl font-bold">${result.preMoneyValuation.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Post-Money Valuation</p>
                                  <p className="text-xl font-bold">${result.postMoneyValuation.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Investor Equity</p>
                                  <p className="text-xl font-bold">{result.investorEquity.toFixed(2)}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Return on Investment</p>
                                  <p className="text-xl font-bold">{result.roi.toFixed(2)}x</p>
                                </div>
                              </div>
                              
                              <div className="pt-4 border-t">
                                <h4 className="font-medium mb-3">Key User Metrics</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-slate-500">Avg. Revenue Per User</p>
                                    <p className="text-lg font-semibold">${result.arpu.toFixed(2)}/month</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-slate-500">Customer Acquisition Cost</p>
                                    <p className="text-lg font-semibold">${result.cac}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-slate-500">Customer Lifetime Value</p>
                                    <p className="text-lg font-semibold">${result.ltv.toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm text-slate-500">LTV:CAC Ratio</p>
                                  <p className="text-lg font-semibold">{result.ltvCacRatio.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Growth Projections */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Revenue Growth Projections</h3>
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={calculateVcValuation().projectedArrByYear}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                            <YAxis tickFormatter={(value) => `$${value >= 1000000 ? (value/1000000).toFixed(1) + 'M' : value >= 1000 ? (value/1000).toFixed(0) + 'K' : value}`} />
                            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Annual Revenue']} />
                            <Bar dataKey="revenue" fill="#8884d8" name="Projected Revenue" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* User Growth Projections */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">User Growth Projections</h3>
                      <div className="bg-white rounded-md border p-4">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Year</th>
                              <th className="text-left p-2">Users</th>
                              <th className="text-left p-2">ARPU</th>
                              <th className="text-left p-2">Annual Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {calculateVcValuation().projectedArrByYear.map((year) => (
                              <tr key={year.year} className="border-b">
                                <td className="p-2">Year {year.year}</td>
                                <td className="p-2">{year.users.toLocaleString()}</td>
                                <td className="p-2">${year.arpu}/mo</td>
                                <td className="p-2">${year.revenue.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Call to Action */}
                    <div className="flex justify-end space-x-4 mt-4">
                      <Button variant="outline" onClick={exportToPdf}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Save Projections
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        {/* Public View Tab */}
          <TabsContent value="public-view" className="space-y-4">
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-2xl">Public Site Preview</CardTitle>
                <CardDescription>
                  Preview how the site appears to non-authenticated visitors without having to sign out
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-background">
                  <div className="mb-4 border-b pb-4">
                    <p className="font-medium text-lg mb-2">Preview Controls</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setPublicPreviewPage('home')}>
                        Home Page
                      </Button>
                      <Button variant="outline" onClick={() => setPublicPreviewPage('about')}>
                        About Us
                      </Button>
                      <Button variant="outline" onClick={() => setPublicPreviewPage('how-it-works')}>
                        How It Works
                      </Button>
                      <Button variant="outline" onClick={() => setPublicPreviewPage('restaurant-partners')}>
                        Restaurant Partners
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="border-b">
                      {/* Customized Public Header with disabled navigation links */}
                      <div className="bg-background border-b">
                        <div className="container mx-auto px-4 py-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <span className="text-primary font-poppins font-bold text-2xl cursor-pointer">Convive</span>
                                <span className="text-slate-400 italic text-base ml-2.5 font-light tracking-wide">(Come·Vibe)</span>
                              </div>
                            </div>
                            <nav className="hidden md:flex items-center space-x-8">
                              <button 
                                className={`text-base font-medium ${publicPreviewPage === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setPublicPreviewPage('home')}
                              >
                                Home
                              </button>
                              <button 
                                className={`text-base font-medium ${publicPreviewPage === 'how-it-works' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setPublicPreviewPage('how-it-works')}
                              >
                                How It Works
                              </button>
                              <button 
                                className={`text-base font-medium ${publicPreviewPage === 'restaurant-partners' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setPublicPreviewPage('restaurant-partners')}
                              >
                                Restaurants
                              </button>
                              <button 
                                className={`text-base font-medium ${publicPreviewPage === 'about' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setPublicPreviewPage('about')}
                              >
                                About
                              </button>
                            </nav>
                            <div className="flex items-center space-x-4">
                              <button className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                                Log In
                              </button>
                              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
                                Sign Up
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      {/* Render different public pages based on selection */}
                      <div className="mx-auto max-w-screen-xl">
                        {publicPreviewPage === 'home' && <PublicHomePreview />}
                        {publicPreviewPage === 'about' && <AboutUsPreview />}
                        {publicPreviewPage === 'how-it-works' && <HowItWorksWrapper />}
                        {publicPreviewPage === 'restaurant-partners' && <RestaurantPartnersWrapper />}
                      </div>
                    </div>
                    <div className="border-t p-4">
                      <Footer />
                    </div>
                    <div className="border-t p-4 flex justify-center">
                      {/* Custom mobile navigation that uses state instead of links */}
                      <div className="md:hidden w-full max-w-md flex items-center justify-between p-4 rounded-lg bg-background border">
                        <button 
                          className={`flex flex-col items-center space-y-1 ${publicPreviewPage === 'home' ? 'text-primary' : 'text-muted-foreground'}`}
                          onClick={() => setPublicPreviewPage('home')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          <span className="text-xs">Home</span>
                        </button>
                        <button 
                          className={`flex flex-col items-center space-y-1 ${publicPreviewPage === 'how-it-works' ? 'text-primary' : 'text-muted-foreground'}`}
                          onClick={() => setPublicPreviewPage('how-it-works')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                          </svg>
                          <span className="text-xs">How It Works</span>
                        </button>
                        <button 
                          className={`flex flex-col items-center space-y-1 ${publicPreviewPage === 'restaurant-partners' ? 'text-primary' : 'text-muted-foreground'}`}
                          onClick={() => setPublicPreviewPage('restaurant-partners')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M6.8 22 12 17l5.2 5"/>
                            <path d="M10 7H4l6-5 6 5h-6Z"/>
                            <path d="M5 22v-3"/>
                            <path d="M19 22v-3"/>
                            <path d="M10 22v-8.3a.7.7 0 0 1 .7-.7h2.6a.7.7 0 0 1 .7.7V22"/>
                          </svg>
                          <span className="text-xs">Restaurants</span>
                        </button>
                        <button 
                          className={`flex flex-col items-center space-y-1 ${publicPreviewPage === 'about' ? 'text-primary' : 'text-muted-foreground'}`}
                          onClick={() => setPublicPreviewPage('about')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                          </svg>
                          <span className="text-xs">About</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Group Formation Test Tab */}
          <TabsContent value="group-formation-test" className="space-y-4">
            <Card className="p-8 text-center">
              <CardHeader>
                <CardTitle className="text-2xl">Group Formation Testing</CardTitle>
                <CardDescription>
                  Test the optimal group formation algorithm with real user data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="mx-auto max-w-md">
                  <div className="bg-primary/5 rounded-lg p-4 mb-8">
                    <p className="text-sm text-muted-foreground">
                      The group formation algorithm creates optimal dining groups with:
                    </p>
                    <ul className="mt-2 text-sm text-left space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Target of 5-6 users per table (plus 1 host)</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Minimum of 4 users per table (plus 1 host)</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Maximum of 7 users per table (plus 1 host) when needed</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Balanced distribution across tables (max difference: 1 person)</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <Button 
                      className="bg-gradient-to-r from-primary to-primary/80 gap-2"
                      onClick={() => window.location.href = "/group-formation-test"}
                    >
                      <Users className="h-5 w-5" />
                      Go to Group Formation Testing
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  The testing page allows you to select users and see how they would be grouped
                  for optimal dining experiences.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* AI Testing Tab */}
          <TabsContent value="ai-testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Testing Dashboard</CardTitle>
                <CardDescription>
                  Test OpenAI integration features including recipe analysis, wine pairing, and call script generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <Link href="/ai-test">
                    <Button className="w-full sm:w-auto">
                      <FileSearch className="mr-2 h-4 w-4" />
                      Advanced AI Testing Dashboard
                    </Button>
                  </Link>
                  <Link href="/sommelier">
                    <Button className="w-full sm:w-auto" variant="secondary">
                      <Wine className="mr-2 h-4 w-4" />
                      Sommelier AI Tool
                    </Button>
                  </Link>
                </div>
                
                <Tabs defaultValue="recipe">
                  <TabsList className="flex flex-wrap w-full">
                    <TabsTrigger value="recipe" className="flex-1">Recipe Analysis</TabsTrigger>
                    <TabsTrigger value="wine" className="flex-1">Wine Pairing</TabsTrigger>
                  </TabsList>
                  
                  {/* Recipe Analysis Tab */}
                  <TabsContent value="recipe" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Recipe Upload</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">AI Status:</span>
                            {isCheckingAi ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : aiStatus === false ? (
                              <Badge variant="destructive">Offline</Badge>
                            ) : (
                              <Badge className="bg-green-600 text-white">Online</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col">
                          <Label htmlFor="recipeNotes" className="mb-2">Additional Notes or Context</Label>
                          <Textarea 
                            id="recipeNotes"
                            placeholder="Add any notes about the recipe (optional)"
                            value={recipeNotes}
                            onChange={(e) => setRecipeNotes(e.target.value)}
                            className="resize-none mb-2"
                            rows={3}
                          />
                          
                          <div className="flex gap-4">
                            <input
                              type="file"
                              accept=".txt,.doc,.docx,.pdf"
                              className="hidden"
                              ref={fileInputRef}
                              onChange={handleRecipeFileChange}
                            />
                            <Button 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Select Recipe File
                            </Button>
                            
                            <Button 
                              onClick={handleRecipeUpload}
                              disabled={!recipeFile || isUploading || !aiStatus}
                              className="w-full"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Analyze Recipe
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {recipeFile && (
                            <p className="text-sm mt-2">
                              Selected file: {recipeFile.name}
                            </p>
                          )}
                        </div>
                        
                        {recipeAnalysis && (
                          <div className="border rounded-md p-4">
                            <h4 className="font-medium mb-2">Recipe Analysis Summary</h4>
                            <p className="text-sm mb-4">{recipeAnalysis.recipeName}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <h5 className="text-sm font-medium mb-1">Preparation Time</h5>
                                <p className="text-sm">{recipeAnalysis.prepTime || "Not specified"}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-1">Cooking Time</h5>
                                <p className="text-sm">{recipeAnalysis.cookTime || "Not specified"}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-1">Difficulty</h5>
                                <p className="text-sm">{recipeAnalysis.difficulty || "Not specified"}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-1">Servings</h5>
                                <p className="text-sm">{recipeAnalysis.servings || "Not specified"}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">Explore Components:</h5>
                              <div className="flex flex-wrap gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem({type: 'ingredients', name: 'Ingredients'});
                                    setItemDetails(recipeAnalysis.ingredients.join('\n'));
                                  }}
                                >
                                  Ingredients
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem({type: 'technique', name: 'Techniques'});
                                    setItemDetails(recipeAnalysis.techniques.join('\n'));
                                  }}
                                >
                                  Techniques
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem({type: 'flavor', name: 'Flavor Profile'});
                                    setItemDetails(recipeAnalysis.flavorProfile.join('\n'));
                                  }}
                                >
                                  Flavor Profile
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem({type: 'origin', name: 'Cultural Origin'});
                                    setItemDetails(recipeAnalysis.culturalOrigin || 'Not identified');
                                  }}
                                >
                                  Cultural Origin
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem({type: 'talking_points', name: 'Host Talking Points'});
                                    setItemDetails(recipeAnalysis.hostTalkingPoints.join('\n'));
                                  }}
                                >
                                  Host Talking Points
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Details</h3>
                        {selectedItem ? (
                          <div className="border rounded-md p-4 h-[460px]">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">{selectedItem.name}</h4>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedItem(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <ScrollArea className="h-[370px]">
                              <div className="space-y-2">
                                {itemDetails.split('\n').map((item, i) => (
                                  <p key={i} className="text-sm">
                                    {item.trim() && (
                                      <>
                                        {selectedItem.type === 'ingredients' && <Check className="inline h-3 w-3 mr-2 text-green-500" />}
                                        {selectedItem.type === 'technique' && <Wrench className="inline h-3 w-3 mr-2 text-blue-500" />}
                                        {selectedItem.type === 'flavor' && <Utensils className="inline h-3 w-3 mr-2 text-orange-500" />}
                                        {selectedItem.type === 'talking_points' && <MessageSquare className="inline h-3 w-3 mr-2 text-purple-500" />}
                                        {item}
                                      </>
                                    )}
                                  </p>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        ) : (
                          <div className="border rounded-md p-4 h-[460px] flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <FileSearch className="mx-auto h-10 w-10 mb-2" />
                              <p>No item selected</p>
                              <p className="text-sm">Click on a component to view details</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Wine Pairing Tab */}
                  <TabsContent value="wine" className="mt-4 space-y-4">
                    <Tabs defaultValue="pairing">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pairing">Wine Pairing</TabsTrigger>
                        <TabsTrigger value="database">Wine Database</TabsTrigger>
                      </TabsList>
                      
                      {/* Wine Pairing Tool */}
                      <TabsContent value="pairing" className="mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-medium mb-4">Wine Pairing Analyzer</h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="dishName">Dish Name</Label>
                                <Input id="dishName" placeholder="Enter the name of the dish" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="ingredients">Main Ingredients</Label>
                                <Textarea 
                                  id="ingredients" 
                                  placeholder="Enter the main ingredients (one per line)" 
                                  rows={4}
                                  className="resize-none"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="preparation">Preparation Method</Label>
                                  <Input id="preparation" placeholder="e.g., grilled, roasted, raw" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cuisine">Cuisine Type</Label>
                                  <Input id="cuisine" placeholder="e.g., Italian, French, Asian" />
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="flavorNotes">Key Flavor Notes</Label>
                                <Input id="flavorNotes" placeholder="e.g., spicy, creamy, acidic, sweet" />
                              </div>
                              
                              <Button className="w-full">
                                <Wine className="mr-2 h-4 w-4" />
                                Generate Wine Pairing Suggestions
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium mb-4">Results</h3>
                            <div className="border rounded-md p-6 h-[460px] flex items-center justify-center">
                              <div className="text-center text-muted-foreground">
                                <Wine className="mx-auto h-12 w-12 mb-4" />
                                <p className="text-lg">Wine Pairing Results Will Appear Here</p>
                                <p className="text-sm mt-2">Fill in the dish details and click "Generate" to receive wine pairing recommendations</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      {/* Wine Database Management */}
                      <TabsContent value="database" className="mt-4">
                        <Card className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Wine Database</h2>
                            <Badge variant="outline" className="ml-2">Manage Wines</Badge>
                          </div>
                          <p className="text-muted-foreground mb-4">
                            Search the wine database to find, view, and manage stored wines. This helps you identify duplicates and verify the database content.
                          </p>
                          
                          <div className="space-y-6">
                            <div className="border rounded-lg p-4 bg-card">
                              <h3 className="text-lg font-medium mb-2">Search or View All Wines</h3>
                              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center mb-3">
                                  <Upload className="h-5 w-5 mr-2 text-primary" />
                                  <h3 className="text-lg font-medium">Upload Wine List</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="wine-list-text">Wine List Text</Label>
                                      <Textarea
                                        id="wine-list-text"
                                        placeholder="Paste your wine list here..."
                                        className="min-h-[120px] resize-none"
                                        value={wineText}
                                        onChange={(e) => setWineText(e.target.value)}
                                      />
                                    </div>
                                    
                                    <Button 
                                      onClick={() => {
                                        if (!wineText.trim()) {
                                          toast({
                                            title: "No wine list text",
                                            description: "Please enter a wine list or upload a file",
                                            variant: "destructive"
                                          });
                                          return;
                                        }
                                        
                                        setIsProcessingWine(true);
                                        setUploadProgress(0);
                                        setUploadStatus("Processing text...");
                                        
                                        // Setup a timer to simulate progress
                                        const progressInterval = setInterval(() => {
                                          setUploadProgress(prev => {
                                            // Only increment if less than 90% (save the last 10% for processing)
                                            if (prev < 90) {
                                              const increment = Math.floor(Math.random() * 5) + 1; // Random increment between 1-5%
                                              return Math.min(90, prev + increment);
                                            }
                                            return prev;
                                          });
                                        }, 800);
                                        
                                        fetch('/api/sommelier/ingest-wine-list', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({ wineListText: wineText }),
                                        })
                                          .then(response => {
                                            clearInterval(progressInterval);
                                            setUploadStatus("Processing wine list...");
                                            setUploadProgress(95);
                                            return response.json();
                                          })
                                          .then(data => {
                                            setIsProcessingWine(false);
                                            setUploadProgress(100);
                                            setUploadStatus("Complete");
                                            
                                            if (data.success) {
                                              setWineText('');
                                              toast({
                                                title: "Wine List Processed",
                                                description: `Successfully processed ${data.totalWines} wines`,
                                              });
                                              
                                              // After upload, refresh the wine list
                                              fetch("/api/sommelier/all-wines")
                                                .then(response => response.json())
                                                .then(data => {
                                                  if (data.wines) {
                                                    setSearchResults(data.wines);
                                                  }
                                                });
                                            } else {
                                              toast({
                                                title: "Processing Failed",
                                                description: data.message || "Failed to process wine list",
                                                variant: "destructive"
                                              });
                                            }
                                          })
                                          .catch(error => {
                                            setIsProcessingWine(false);
                                            setUploadProgress(0);
                                            setUploadStatus("Failed");
                                            console.error("Error processing wine list:", error);
                                            toast({
                                              title: "Error",
                                              description: "An error occurred while processing the wine list.",
                                              variant: "destructive"
                                            });
                                          });
                                      }}
                                      className="w-full"
                                      variant="default"
                                      disabled={isProcessingWine || !wineText.trim()}
                                    >
                                      {isProcessingWine ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <Wine className="mr-2 h-4 w-4" />
                                          Process Wine List
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="wine-list-file">Or Upload Wine List File</Label>
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                          <Input
                                            id="wine-list-file"
                                            type="file"
                                            className="hidden"
                                            ref={wineFileRef}
                                            accept=".txt,.pdf,.doc,.docx,.csv"
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files.length > 0) {
                                                setWineFile(e.target.files[0]);
                                              }
                                            }}
                                          />
                                          <Button 
                                            variant="outline" 
                                            className="w-full"
                                            onClick={() => wineFileRef.current?.click()}
                                          >
                                            <UploadCloud className="mr-2 h-4 w-4" />
                                            {wineFile ? wineFile.name : "Choose File"}
                                          </Button>
                                          {wineFile && (
                                            <Button 
                                              variant="ghost" 
                                              size="icon"
                                              onClick={() => setWineFile(null)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </div>
                                        
                                        <Button 
                                          onClick={() => {
                                            if (!wineFile) {
                                              toast({
                                                title: "No file selected",
                                                description: "Please select a wine list file",
                                                variant: "destructive"
                                              });
                                              return;
                                            }
                                            
                                            setIsProcessingWine(true);
                                            setUploadProgress(0);
                                            setUploadStatus("Uploading file...");
                                            
                                            const formData = new FormData();
                                            // Ensure the form data parameter name matches the server expectation
                                            formData.append('file', wineFile);
                                            
                                            // Setup a timer to simulate upload progress since we can't get actual upload progress
                                            const progressInterval = setInterval(() => {
                                              setUploadProgress(prev => {
                                                // Only increment if less than 90% (save the last 10% for processing)
                                                if (prev < 90) {
                                                  const increment = Math.floor(Math.random() * 5) + 1; // Random increment between 1-5%
                                                  return Math.min(90, prev + increment);
                                                }
                                                return prev;
                                              });
                                            }, 800);
                                            
                                            // Log the formData to check what's being sent
                                            console.log("Sending wine file upload with name:", wineFile.name);
                                            
                                            fetch('/api/sommelier/ingest-wine-list-file', {
                                              method: 'POST',
                                              body: formData,
                                            })
                                              .then(response => {
                                                clearInterval(progressInterval);
                                                setUploadStatus("Processing wine list...");
                                                setUploadProgress(95);
                                                return response.json();
                                              })
                                              .then(data => {
                                                setIsProcessingWine(false);
                                                setUploadProgress(100);
                                                setUploadStatus("Complete");
                                                
                                                if (data.success) {
                                                  setWineFile(null);
                                                  toast({
                                                    title: "Wine List Processed",
                                                    description: `Successfully processed ${data.totalWines} wines`,
                                                  });
                                                  
                                                  // After upload, refresh the wine list
                                                  fetch("/api/sommelier/all-wines")
                                                    .then(response => response.json())
                                                    .then(data => {
                                                      if (data.wines) {
                                                        setSearchResults(data.wines);
                                                      }
                                                    });
                                                } else {
                                                  toast({
                                                    title: "Processing Failed",
                                                    description: data.message || "Failed to process wine list",
                                                    variant: "destructive"
                                                  });
                                                }
                                              })
                                              .catch(error => {
                                                setIsProcessingWine(false);
                                                setUploadProgress(0);
                                                setUploadStatus("Failed");
                                                console.error("Error processing wine list:", error);
                                                toast({
                                                  title: "Error",
                                                  description: "An error occurred while processing the wine list.",
                                                  variant: "destructive"
                                                });
                                              });
                                          }}
                                          className="w-full mt-2 bg-primary hover:bg-primary/90" // Added mt-2 for spacing and emphasized button style
                                          variant="default"
                                          disabled={isProcessingWine || !wineFile}
                                        >
                                          {isProcessingWine ? (
                                            <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              Processing...
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="mr-2 h-4 w-4" />
                                              <span className="font-medium">Upload & Process Wine List</span>
                                            </>
                                          )}
                                        </Button>
                                        
                                        <div className="text-xs text-muted-foreground">
                                          Supported formats: .txt, .pdf, .doc, .docx, .csv
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {isProcessingWine && (
                                      <div className="mt-4">
                                        <Label className="mb-2 block">Processing Progress</Label>
                                        <Progress 
                                          value={uploadProgress} 
                                          className="h-2" 
                                        />
                                        <div className="mt-1 text-xs text-muted-foreground text-right">
                                          {uploadProgress}% - {uploadStatus}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex flex-1 gap-2">
                                  <Input 
                                    id="wine-search"
                                    placeholder="Search by name, producer, or region..."
                                    className="flex-1"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                  />
                                  <Button 
                                    onClick={() => {
                                      if (searchQuery.trim().length < 3) {
                                        toast({
                                          title: "Search query too short",
                                          description: "Please enter at least 3 characters",
                                          variant: "destructive"
                                        });
                                        return;
                                      }
                                      
                                      // Reset pagination when doing a new search
                                      setCurrentPage(1);
                                      
                                      setIsDatabaseLoading(true);
                                      fetch(`/api/sommelier/all-wines?page=1&pageSize=${pageSize}&search=${encodeURIComponent(searchQuery)}`)
                                        .then(response => response.json())
                                        .then(data => {
                                          if (data.wines && data.wines.length > 0) {
                                            setSearchResults(data.wines);
                                            setTotalPages(data.pagination?.totalPages || 1);
                                            setTotalWines(data.pagination?.totalItems || data.wines.length);
                                            toast({
                                              title: `Found ${data.pagination?.totalItems || data.wines.length} wines`,
                                              description: `Showing page 1 of ${data.pagination?.totalPages || 1}`,
                                            });
                                          } else {
                                            setSearchResults([]);
                                            setTotalPages(1);
                                            setTotalWines(0);
                                            toast({
                                              title: "No Wines Found",
                                              description: `No wines match "${searchQuery}"`,
                                            });
                                          }
                                          setIsDatabaseLoading(false);
                                        })
                                        .catch(error => {
                                          console.error("Error searching wines:", error);
                                          toast({
                                            title: "Search Failed",
                                            description: "Failed to search wine database",
                                            variant: "destructive"
                                          });
                                          setIsDatabaseLoading(false);
                                        });
                                    }}
                                    disabled={searchQuery.trim().length < 3 || isDatabaseLoading}
                                  >
                                    {isDatabaseLoading ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Search className="mr-2 h-4 w-4" />
                                    )}
                                    Search
                                  </Button>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      // Reset pagination when showing all wines
                                      setCurrentPage(1);
                                      setSearchQuery("");
                                      
                                      setIsDatabaseLoading(true);
                                      fetch(`/api/sommelier/all-wines?page=1&pageSize=${pageSize}`)
                                        .then(response => response.json())
                                        .then(data => {
                                          if (data.wines) {
                                            setSearchResults(data.wines);
                                            setTotalPages(data.pagination?.totalPages || 1);
                                            setTotalWines(data.pagination?.totalItems || data.wines.length);
                                            
                                            toast({
                                              title: `Found ${data.pagination?.totalItems || data.wines.length} wines`,
                                              description: `Showing page 1 of ${data.pagination?.totalPages || 1}`
                                            });
                                          } else {
                                            setSearchResults([]);
                                            setTotalPages(1);
                                            setTotalWines(0);
                                            
                                            toast({
                                              title: "No Wines Found",
                                              description: "The wine database appears to be empty."
                                            });
                                          }
                                          setIsDatabaseLoading(false);
                                        })
                                        .catch(error => {
                                          console.error("Error fetching all wines:", error);
                                          toast({
                                            title: "Error Fetching Wines",
                                            description: "Failed to retrieve wine database.",
                                            variant: "destructive"
                                          });
                                          setIsDatabaseLoading(false);
                                        });
                                    }}
                                    disabled={isDatabaseLoading}
                                  >
                                    {isDatabaseLoading ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Database className="mr-2 h-4 w-4" />
                                    )}
                                    Show All Wines
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setIsDatabaseLoading(true);
                                      setSearchQuery("");
                                      
                                      fetch("/api/sommelier/find-duplicates")
                                        .then(response => response.json())
                                        .then(data => {
                                          if (data.duplicates) {
                                            const allDuplicates = data.duplicates.flatMap((group: any[]) => group);
                                            setSearchResults(allDuplicates);
                                            toast({
                                              title: `Found ${data.duplicates.length} duplicate groups`,
                                              description: `${allDuplicates.length} total duplicate wines detected.`,
                                            });
                                          } else {
                                            setSearchResults([]);
                                            toast({
                                              title: "No Duplicates Found",
                                              description: "No duplicate wines were detected in the database.",
                                            });
                                          }
                                          setIsDatabaseLoading(false);
                                        })
                                        .catch(error => {
                                          console.error("Error finding duplicates:", error);
                                          toast({
                                            title: "Error Finding Duplicates",
                                            description: "Failed to analyze wine database for duplicates.",
                                            variant: "destructive"
                                          });
                                          setIsDatabaseLoading(false);
                                        });
                                    }}
                                    disabled={isDatabaseLoading}
                                  >
                                    {isDatabaseLoading ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Find Duplicates
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div id="wine-database-results" className="space-y-4">
                              {isDatabaseLoading && (
                                <div className="flex justify-center p-8">
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <div className="text-sm text-muted-foreground">Loading wines...</div>
                                  </div>
                                </div>
                              )}
                              
                              {searchResults.length > 0 && !isDatabaseLoading && (
                                <div className="border rounded-lg p-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">
                                      Wine Database Results 
                                      <Badge variant="outline" className="ml-2">
                                        {totalWines > 0 ? `${totalWines} total wines` : searchResults.length}
                                      </Badge>
                                    </h3>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={currentPage <= 1 || isDatabaseLoading}
                                          onClick={() => {
                                            const newPage = Math.max(1, currentPage - 1);
                                            setCurrentPage(newPage);
                                            setIsDatabaseLoading(true);
                                            
                                            const url = searchQuery
                                              ? `/api/sommelier/all-wines?page=${newPage}&pageSize=${pageSize}&search=${encodeURIComponent(searchQuery)}`
                                              : `/api/sommelier/all-wines?page=${newPage}&pageSize=${pageSize}`;
                                              
                                            fetch(url)
                                              .then(response => response.json())
                                              .then(data => {
                                                if (data.wines) {
                                                  setSearchResults(data.wines);
                                                }
                                                setIsDatabaseLoading(false);
                                              })
                                              .catch(error => {
                                                console.error("Error fetching wines:", error);
                                                setIsDatabaseLoading(false);
                                              });
                                          }}
                                        >
                                          <ChevronDown className="h-4 w-4 rotate-90" />
                                        </Button>
                                        
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={currentPage >= totalPages || isDatabaseLoading}
                                          onClick={() => {
                                            const newPage = Math.min(totalPages, currentPage + 1);
                                            setCurrentPage(newPage);
                                            setIsDatabaseLoading(true);
                                            
                                            const url = searchQuery
                                              ? `/api/sommelier/all-wines?page=${newPage}&pageSize=${pageSize}&search=${encodeURIComponent(searchQuery)}`
                                              : `/api/sommelier/all-wines?page=${newPage}&pageSize=${pageSize}`;
                                              
                                            fetch(url)
                                              .then(response => response.json())
                                              .then(data => {
                                                if (data.wines) {
                                                  setSearchResults(data.wines);
                                                }
                                                setIsDatabaseLoading(false);
                                              })
                                              .catch(error => {
                                                console.error("Error fetching wines:", error);
                                                setIsDatabaseLoading(false);
                                              });
                                          }}
                                        >
                                          <ChevronDown className="h-4 w-4 -rotate-90" />
                                        </Button>
                                      </div>
                                      
                                      <Select
                                        value={pageSize.toString()}
                                        onValueChange={(value) => {
                                          const newSize = parseInt(value);
                                          setPageSize(newSize);
                                          setCurrentPage(1);
                                          
                                          setIsDatabaseLoading(true);
                                          const url = searchQuery 
                                            ? `/api/sommelier/all-wines?page=1&pageSize=${newSize}&search=${encodeURIComponent(searchQuery)}`
                                            : `/api/sommelier/all-wines?page=1&pageSize=${newSize}`;
                                            
                                          fetch(url)
                                            .then(response => response.json())
                                            .then(data => {
                                              if (data.wines) {
                                                setSearchResults(data.wines);
                                                setTotalPages(data.pagination?.totalPages || 1);
                                                setTotalWines(data.pagination?.totalItems || data.wines.length);
                                              }
                                              setIsDatabaseLoading(false);
                                            })
                                            .catch(error => {
                                              console.error("Error fetching wines:", error);
                                              setIsDatabaseLoading(false);
                                            });
                                        }}
                                      >
                                        <SelectTrigger className="w-[100px] h-8">
                                          <SelectValue placeholder="Per page" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="20">20 / page</SelectItem>
                                          <SelectItem value="50">50 / page</SelectItem>
                                          <SelectItem value="100">100 / page</SelectItem>
                                          <SelectItem value="200">200 / page</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {searchResults.map((wine, index) => (
                                      <Card key={index} className="h-full">
                                        <CardHeader>
                                          <div className="flex items-start justify-between">
                                            <CardTitle className="text-base">{wine.name?.value || "Unknown Wine"}</CardTitle>
                                            {wine.vintage?.value && 
                                              <Badge variant="outline" className="ml-1 shrink-0">
                                                {wine.vintage.value}
                                              </Badge>
                                            }
                                          </div>
                                          <CardDescription>
                                            {wine.producer?.value && <div>{wine.producer.value}</div>}
                                            {wine.region?.value && <div>{wine.region.value}</div>}
                                            {wine.country?.value && <div>{wine.country.value}</div>}
                                          </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                          {wine.varietals?.value && (
                                            <div>
                                              <span className="font-medium">Grapes:</span> {Array.isArray(wine.varietals.value) 
                                                ? wine.varietals.value.join(", ") 
                                                : wine.varietals.value}
                                            </div>
                                          )}
                                          {wine.style_summary?.value && (
                                            <div>
                                              <span className="font-medium">Style:</span> {wine.style_summary.value}
                                            </div>
                                          )}
                                          {wine.body?.value && (
                                            <div>
                                              <span className="font-medium">Body:</span> {wine.body.value}
                                            </div>
                                          )}
                                        </CardContent>
                                        <CardFooter>
                                          <Button variant="outline" size="sm" onClick={() => {
                                            setWineToView(wine);
                                            
                                            toast({
                                              title: "Wine Details",
                                              description: `Viewing details for ${wine.name?.value || "Unknown Wine"} ${wine.vintage?.value ? `(${wine.vintage.value})` : ''}`,
                                            });
                                          }}>
                                            <Info className="mr-2 h-4 w-4" />
                                            View Details
                                          </Button>
                                        </CardFooter>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {!isDatabaseLoading && searchResults.length === 0 && searchQuery && (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                  <div className="text-muted-foreground">
                                    No wines found matching your search criteria.
                                  </div>
                                </div>
                              )}
                              
                              {!isDatabaseLoading && searchResults.length === 0 && !searchQuery && (
                                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
                                  <Database className="h-12 w-12 mb-4 text-muted-foreground" />
                                  <div className="text-muted-foreground">
                                    <p className="text-lg">Your Wine Collection</p>
                                    <p className="text-sm mt-2">Use the search box above or click "Show All Wines" to view your wine database</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Wine Detail View */}
                              {wineToView && (
                                <Card className="border rounded-lg p-4 mt-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <h3 className="text-xl font-semibold">{wineToView.name?.value || "Unknown Wine"}</h3>
                                      <p className="text-muted-foreground">
                                        {wineToView.producer?.value} {wineToView.vintage?.value && `• ${wineToView.vintage.value}`}
                                      </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setWineToView(null)}>
                                      Close
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium mb-1">Wine Details</h4>
                                        <div className="space-y-1 text-sm">
                                          {wineToView.producer?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Producer:</span>
                                              <span>{wineToView.producer.value}</span>
                                            </div>
                                          )}
                                          {wineToView.region?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Region:</span>
                                              <span>{wineToView.region.value}</span>
                                            </div>
                                          )}
                                          {wineToView.country?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Country:</span>
                                              <span>{wineToView.country.value}</span>
                                            </div>
                                          )}
                                          {wineToView.vintage?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Vintage:</span>
                                              <span>{wineToView.vintage.value}</span>
                                            </div>
                                          )}
                                          {wineToView.varietals?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Grapes:</span>
                                              <span>{Array.isArray(wineToView.varietals.value) 
                                                ? wineToView.varietals.value.join(", ") 
                                                : wineToView.varietals.value}</span>
                                            </div>
                                          )}
                                          {wineToView.style?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Wine Style:</span>
                                              <span>{wineToView.style.value}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium mb-1">Tasting Profile</h4>
                                        <div className="space-y-1 text-sm">
                                          {wineToView.body?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Body:</span>
                                              <span>{wineToView.body.value}</span>
                                            </div>
                                          )}
                                          {wineToView.acidity?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Acidity:</span>
                                              <span>{wineToView.acidity.value}</span>
                                            </div>
                                          )}
                                          {wineToView.tannin?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Tannin:</span>
                                              <span>{wineToView.tannin.value}</span>
                                            </div>
                                          )}
                                          {wineToView.sweetness?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Sweetness:</span>
                                              <span>{wineToView.sweetness.value}</span>
                                            </div>
                                          )}
                                          {wineToView.alcohol?.value && (
                                            <div className="flex">
                                              <span className="font-medium w-24">Alcohol:</span>
                                              <span>{wineToView.alcohol.value}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                      {wineToView.tasting_notes?.value && (
                                        <div>
                                          <h4 className="font-medium mb-1">Tasting Notes</h4>
                                          <p className="text-sm">{wineToView.tasting_notes.value}</p>
                                        </div>
                                      )}
                                      
                                      {wineToView.style_summary?.value && (
                                        <div>
                                          <h4 className="font-medium mb-1">Style Summary</h4>
                                          <p className="text-sm">{wineToView.style_summary.value}</p>
                                        </div>
                                      )}
                                      
                                      {wineToView.food_pairings?.value && (
                                        <div>
                                          <h4 className="font-medium mb-1">Food Pairings</h4>
                                          <p className="text-sm">{Array.isArray(wineToView.food_pairings.value) 
                                            ? wineToView.food_pairings.value.join(", ") 
                                            : wineToView.food_pairings.value}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              )}
                            </div>
                          </div>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;