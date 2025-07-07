import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextProvider";

// Form schema using zod
const applicationSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Valid email is required"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }).refine(date => {
    const today = new Date();
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
    return date <= eighteenYearsAgo;
  }, "You must be at least 18 years old"),
  instagramHandle: z.string().optional(),
  linkedInProfile: z.string().optional(),
  otherSocialMedia: z.string().optional(),
  currentOccupation: z.string().min(2, "Current occupation is required"),
  annualIncome: z.string().min(1, "Annual income is required"),
  diningPreferences: z.string().min(10, "Please describe your dining preferences"),
  whyHighRoller: z.string().min(20, "Please explain why you want a High Roller ticket"),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface HighRollerApplicationFormProps {
  onClose: () => void;
}

export default function HighRollerApplicationForm({ onClose }: HighRollerApplicationFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with default values
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      instagramHandle: "",
      linkedInProfile: "",
      otherSocialMedia: "",
      currentOccupation: user?.occupation || "",
      annualIncome: "",
      diningPreferences: "",
      whyHighRoller: "",
    },
  });

  // Form submission handler
  const onSubmit = async (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real application, we would send this data to the server
      // const response = await fetch('/api/high-roller-applications', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     ...data,
      //     userId: user?.id
      //   }),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to submit application');
      // }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Application Submitted",
        description: "Thank you for applying for a High Roller ticket. We will review your application and get back to you soon.",
      });
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">High Roller Ticket Application</h2>
        <p className="text-muted-foreground mt-1">
          Apply for a complimentary High Roller ticket. All fields are required unless marked optional.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          // Disable dates that would make user younger than 18
                          const today = new Date();
                          const eighteenYearsAgo = new Date();
                          eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
                          return date > eighteenYearsAgo || date > today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    You must be at least 18 years old to apply.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Social Media Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Social Media (Optional)</h3>
            
            <FormField
              control={form.control}
              name="instagramHandle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Handle</FormLabel>
                  <FormControl>
                    <Input placeholder="@username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="linkedInProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="otherSocialMedia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Social Media Profiles</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List any other social media profiles or websites" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Professional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Professional Information</h3>
            
            <FormField
              control={form.control}
              name="currentOccupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Occupation</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer, Doctor, Entrepreneur, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="annualIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income Range</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...field}
                    >
                      <option value="">Select income range</option>
                      <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                      <option value="$100,000 - $150,000">$100,000 - $150,000</option>
                      <option value="$150,000 - $200,000">$150,000 - $200,000</option>
                      <option value="$200,000 - $300,000">$200,000 - $300,000</option>
                      <option value="$300,000 - $500,000">$300,000 - $500,000</option>
                      <option value="$500,000+">$500,000+</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Dining Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dining Preferences</h3>
            
            <FormField
              control={form.control}
              name="diningPreferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your dining preferences</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your favorite cuisines, restaurant experiences, and dining preferences." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include favorite cuisines, wines, and types of dining experiences.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="whyHighRoller"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why do you want a High Roller ticket?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain why you're interested in our High Roller experience and what you hope to get out of it." 
                      className="min-h-[150px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Tell us why you're a good fit for our premium dining experience.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}