import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertUserPreferencesSchema } from "@shared/schema";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

// Step 1: Define the form schema using Zod
const questionnaireSchema = z.object({
  diningPreferences: z.object({
    cuisines: z.array(z.string()).min(1, "Select at least one cuisine"),
    noiseLevel: z.string().min(1, "Please select a noise preference"),
    priceRange: z.string().min(1, "Please select a price range"),
    ambiance: z.array(z.string()).min(1, "Select at least one ambiance"),
    groupSize: z.string().min(1, "Please select a preferred group size"),
    dietaryRestrictions: z.array(z.string()).optional(),
    drinkPreference: z.string().min(1, "Please select a drink preference"),
  }),
  socialPreferences: z.object({
    conversationTopics: z.array(z.string()).min(1, "Select at least one conversation topic"),
    conversationStyle: z.string().min(1, "Please select a conversation style"),
    meetupFrequency: z.string().min(1, "Please select a meetup frequency"),
    meetupGoal: z.string().min(1, "Please select a meetup goal"),
    personalityTraits: z.array(z.string()).min(1, "Select at least one personality trait"),
  }),
  atmospherePreferences: z.object({
    musicPreference: z.string().min(1, "Please select a music preference"),
    seatingPreference: z.string().min(1, "Please select a seating preference"),
    lightingPreference: z.string().min(1, "Please select a lighting preference"),
  }),
  dietaryRestrictions: z.array(z.string()).optional(),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
});

type QuestionnaireData = z.infer<typeof questionnaireSchema>;

// Arrays of options for select fields
const cuisineOptions = [
  "Italian", "Japanese", "Mediterranean", "Mexican", "Chinese", "American", 
  "French", "Thai", "Indian", "Spanish", "Korean", "Vietnamese", "Middle Eastern"
];

const ambianceOptions = [
  "Cozy", "Elegant", "Modern", "Casual", "Romantic", "Trendy", "Traditional", "Rustic"
];

const dietaryRestrictionOptions = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", 
  "Halal", "Kosher", "Pescatarian", "Keto", "Paleo"
];

const conversationTopicOptions = [
  "Food & Cooking", "Travel", "Art & Culture", "Books", "Movies & TV", 
  "Music", "Technology", "Sports", "Politics", "Business", "Science", 
  "Health & Wellness", "Fashion", "Photography", "Gaming"
];

const personalityTraitOptions = [
  "Outgoing", "Reserved", "Adventurous", "Analytical", "Creative", 
  "Organized", "Spontaneous", "Relaxed", "Energetic", "Thoughtful"
];

const interestOptions = [
  "Cooking", "Hiking", "Photography", "Reading", "Travel", "Art", 
  "Music", "Dancing", "Sports", "Theater", "Movies", "Gardening", 
  "Wine Tasting", "Yoga", "Fashion", "Technology", "History", "Science"
];

export default function Questionnaire() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Initialize the form with default values
  const form = useForm<QuestionnaireData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      diningPreferences: {
        cuisines: [],
        noiseLevel: "",
        priceRange: "",
        ambiance: [],
        groupSize: "",
        dietaryRestrictions: [],
        drinkPreference: "",
      },
      socialPreferences: {
        conversationTopics: [],
        conversationStyle: "",
        meetupFrequency: "",
        meetupGoal: "",
        personalityTraits: [],
      },
      atmospherePreferences: {
        musicPreference: "",
        seatingPreference: "",
        lightingPreference: "",
      },
      dietaryRestrictions: [],
      interests: [],
    },
  });

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: QuestionnaireData) => {
      if (!user) throw new Error("User not authenticated");
      
      const preferenceData = {
        userId: user.id,
        diningPreferences: data.diningPreferences,
        socialPreferences: data.socialPreferences,
        atmospherePreferences: data.atmospherePreferences,
        dietaryRestrictions: data.dietaryRestrictions || [],
        interests: data.interests,
      };
      
      return await apiRequest("POST", `/api/users/${user.id}/preferences`, preferenceData);
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved!",
        description: "Your dining and social preferences have been saved successfully.",
      });
      navigate("/matches");
    },
    onError: (error) => {
      toast({
        title: "Error saving preferences",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: QuestionnaireData) => {
    savePreferencesMutation.mutateAsync(data);
  };

  // Navigation between steps
  const nextStep = () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid) {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      }
    });
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Helper to get fields that should be validated for the current step
  function getFieldsForStep(step: number) {
    switch (step) {
      case 1:
        return ['diningPreferences.cuisines', 'diningPreferences.noiseLevel', 'diningPreferences.priceRange', 'diningPreferences.ambiance', 'diningPreferences.dietaryRestrictions'];
      case 2:
        return ['diningPreferences.groupSize', 'diningPreferences.drinkPreference', 'socialPreferences.conversationTopics', 'socialPreferences.conversationStyle'];
      case 3:
        return ['socialPreferences.meetupFrequency', 'socialPreferences.meetupGoal', 'socialPreferences.personalityTraits', 'atmospherePreferences.musicPreference'];
      case 4:
        return ['atmospherePreferences.seatingPreference', 'atmospherePreferences.lightingPreference', 'interests'];
      default:
        return [];
    }
  }

  // Check if the current step is the final step
  const isFinalStep = currentStep === totalSteps;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-poppins text-center">
            Convive Questionnaire
          </CardTitle>
          <CardDescription className="text-center">
            Help us understand your dining preferences and personality to match you with compatible dining companions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm font-medium">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <Progress 
              value={(currentStep / totalSteps) * 100} 
              className="h-2"
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Dining Preferences - Part 1 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Dining Preferences</h2>

                  {/* Cuisine Preferences */}
                  <FormField
                    control={form.control}
                    name="diningPreferences.cuisines"
                    render={() => (
                      <FormItem>
                        <FormLabel>What cuisines do you enjoy?</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {cuisineOptions.map((cuisine) => (
                            <FormField
                              key={cuisine}
                              control={form.control}
                              name="diningPreferences.cuisines"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={cuisine}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(cuisine)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, cuisine])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== cuisine
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {cuisine}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Noise Level Preference */}
                  <FormField
                    control={form.control}
                    name="diningPreferences.noiseLevel"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What's your preferred noise level when dining?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Quiet" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Quiet - I prefer quiet conversations
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Moderate" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Moderate - Some background noise is fine
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Lively" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Lively - I enjoy a bustling atmosphere
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price Range */}
                  <FormField
                    control={form.control}
                    name="diningPreferences.priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What's your preferred price range?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a price range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="$">$ (Budget-friendly)</SelectItem>
                            <SelectItem value="$$">$$ (Moderate)</SelectItem>
                            <SelectItem value="$$$">$$$ (Upscale)</SelectItem>
                            <SelectItem value="$$$$">$$$$ (Fine dining)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ambiance */}
                  <FormField
                    control={form.control}
                    name="diningPreferences.ambiance"
                    render={() => (
                      <FormItem>
                        <FormLabel>What restaurant ambiance do you prefer?</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {ambianceOptions.map((ambiance) => (
                            <FormField
                              key={ambiance}
                              control={form.control}
                              name="diningPreferences.ambiance"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={ambiance}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(ambiance)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, ambiance])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== ambiance
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {ambiance}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dietary Restrictions */}
                  <FormField
                    control={form.control}
                    name="dietaryRestrictions"
                    render={() => (
                      <FormItem>
                        <FormLabel>Do you have any dietary restrictions?</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {dietaryRestrictionOptions.map((restriction) => (
                            <FormField
                              key={restriction}
                              control={form.control}
                              name="dietaryRestrictions"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={restriction}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(restriction)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, restriction])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== restriction
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {restriction}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormDescription>
                          This helps us match you with restaurants that can accommodate your needs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Dining Preferences - Part 2 & Social Preferences - Part 1 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Group Dining & Social Preferences</h2>

                  {/* Group Size */}
                  <FormField
                    control={form.control}
                    name="diningPreferences.groupSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What's your preferred group size for dining out?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select group size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Intimate">Intimate (2-3 people)</SelectItem>
                            <SelectItem value="Small">Small (4-5 people)</SelectItem>
                            <SelectItem value="Medium">Medium (6-8 people)</SelectItem>
                            <SelectItem value="Large">Large (8+ people)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This helps us create appropriately sized meetup groups.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Drink Preference */}
                  <FormField
                    control={form.control}
                    name="diningPreferences.drinkPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What are your drink preferences?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select drink preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Non-alcoholic">Non-alcoholic only</SelectItem>
                            <SelectItem value="Wine enthusiast">Wine enthusiast</SelectItem>
                            <SelectItem value="Craft beer lover">Craft beer lover</SelectItem>
                            <SelectItem value="Cocktail aficionado">Cocktail aficionado</SelectItem>
                            <SelectItem value="All drinks">I enjoy all types of drinks</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conversation Topics */}
                  <FormField
                    control={form.control}
                    name="socialPreferences.conversationTopics"
                    render={() => (
                      <FormItem>
                        <FormLabel>What topics do you enjoy discussing?</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {conversationTopicOptions.map((topic) => (
                            <FormField
                              key={topic}
                              control={form.control}
                              name="socialPreferences.conversationTopics"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={topic}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, topic])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== topic
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {topic}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conversation Style */}
                  <FormField
                    control={form.control}
                    name="socialPreferences.conversationStyle"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your conversation style?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Listener" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                I'm more of a listener
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Balanced" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                I like a balanced exchange
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Storyteller" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                I enjoy telling stories and leading conversations
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Social Preferences - Part 2 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Social Preferences & Personality</h2>

                  {/* Meetup Frequency */}
                  <FormField
                    control={form.control}
                    name="socialPreferences.meetupFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How often would you like to participate in meetups?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Occasionally">Occasionally</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Meetup Goal */}
                  <FormField
                    control={form.control}
                    name="socialPreferences.meetupGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What's your primary goal for joining Convive?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Make friends">Make new friends</SelectItem>
                            <SelectItem value="Network">Professional networking</SelectItem>
                            <SelectItem value="Food exploration">Explore new restaurants and cuisines</SelectItem>
                            <SelectItem value="Dating">Meet potential dating partners</SelectItem>
                            <SelectItem value="Social activity">Just have a social activity</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Personality Traits */}
                  <FormField
                    control={form.control}
                    name="socialPreferences.personalityTraits"
                    render={() => (
                      <FormItem>
                        <FormLabel>Which personality traits best describe you?</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {personalityTraitOptions.map((trait) => (
                            <FormField
                              key={trait}
                              control={form.control}
                              name="socialPreferences.personalityTraits"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={trait}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(trait)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, trait])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== trait
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {trait}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Music Preference */}
                  <FormField
                    control={form.control}
                    name="atmospherePreferences.musicPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What type of music do you prefer in dining settings?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select music preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="No music">No music / Quiet</SelectItem>
                            <SelectItem value="Background">Soft background music</SelectItem>
                            <SelectItem value="Jazz">Jazz</SelectItem>
                            <SelectItem value="Classical">Classical</SelectItem>
                            <SelectItem value="Contemporary">Contemporary</SelectItem>
                            <SelectItem value="Any">No strong preference</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Atmosphere Preferences & Interests */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Atmosphere & Personal Interests</h2>

                  {/* Seating Preference */}
                  <FormField
                    control={form.control}
                    name="atmospherePreferences.seatingPreference"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What's your preferred seating arrangement?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Booth" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Booth seating
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Table" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Standard table
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Bar" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Bar or high-top seating
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Outdoor" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Outdoor patio (weather permitting)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Lighting Preference */}
                  <FormField
                    control={form.control}
                    name="atmospherePreferences.lightingPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What lighting atmosphere do you prefer?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lighting preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bright">Bright and well-lit</SelectItem>
                            <SelectItem value="Moderate">Moderately lit</SelectItem>
                            <SelectItem value="Dim">Dim, ambient lighting</SelectItem>
                            <SelectItem value="Any">No strong preference</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Personal Interests */}
                  <FormField
                    control={form.control}
                    name="interests"
                    render={() => (
                      <FormItem>
                        <FormLabel>What are your personal interests?</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {interestOptions.map((interest) => (
                            <FormField
                              key={interest}
                              control={form.control}
                              name="interests"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={interest}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(interest)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, interest])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== interest
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {interest}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormDescription>
                          This helps us match you with people who share similar interests.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {isFinalStep && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-2">Ready to Find Your Perfect Convive Companions!</h3>
                  <p className="text-gray-600 mb-4">
                    Based on your preferences, we'll match you with compatible dining companions who share your interests and dining style.
                  </p>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || savePreferencesMutation.isPending}
          >
            Previous
          </Button>
          
          {!isFinalStep ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={form.handleSubmit(onSubmit)}
              disabled={savePreferencesMutation.isPending}
            >
              {savePreferencesMutation.isPending ? "Saving..." : "Save & Find Matches"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
