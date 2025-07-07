import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Slider } from "../ui/slider";
import { useDevice } from "../../hooks/useDevice";
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import { Progress } from "../ui/progress";

interface QuestionnairePageProps {
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function QuestionnairePage({ onUpdate, onNext, onBack }: QuestionnairePageProps) {
  const { isTablet } = useDevice();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questionnaire, setQuestionnaire] = useState({
    personalityTraits: {
      decisionMakingStyle: null as string | null, // analytical, intuitive, consultative, spontaneous
      adaptability: 3, // 1-5 scale
      planningStyle: null as string | null, // planner, flexible, balanced
      risktakingLevel: null as string | null, // conservative, moderate, adventurous
      learningStyle: null as string | null, // visual, auditory, kinesthetic, reading/writing
      problemSolvingApproach: null as string | null, // systematic, creative, collaborative, intuitive
    },
    socialStyle: {
      preferredGroupSize: "medium", // small, medium, large
      comfortWithStrangers: 3, // 1-5 scale
      conversationStyle: null as string | null, // listener, balanced, talker
      socialEnergy: null as string | null, // introvert, ambivert, extrovert
      conflictResolution: null, // avoidant, accommodating, compromising, collaborative
      socialBoundaries: 3, // 1-5 scale
      timeWithFriends: null, // daily, weekly, monthly, occasionally
    },
    lifeValues: {
      coreValues: [], // multiple selection of values
      lifeGoals: [], // multiple selection of goals
      growthMindset: 3, // 1-5 scale
      importantQualities: [], // multiple selection of qualities
      dealBreakers: [], // multiple selection of dealbreakers
      occupation: null as string | null, // professional occupation
    },
    leisurePreferences: {
      activities: [], // multiple selection of activities
      weekendPreference: null, // active, relaxed, balanced
      travelFrequency: null, // rarely, occasionally, regularly, whenever possible
    },
    communicationStyle: {
      communicationPreference: null, // direct, thoughtful, emotional, factual
      humor: null, // dry, sarcastic, silly, witty, situational
      expressiveness: null, // reserved, moderate, expressive
      feedbackStyle: null, // direct, gentle, actionable, questioning
      emotionalAwareness: 3, // 1-5 scale
    },
  });

  const updateQuestionnaireField = (
    category: string,
    field: string,
    value: any
  ) => {
    setQuestionnaire((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleCheckboxChange = (
    category: string,
    field: string,
    value: string,
    checked: boolean
  ) => {
    // Get current values safely
    const currentValuesRaw = getCurrentValue(category, field);
    
    // Ensure we're working with an array
    const currentValues = Array.isArray(currentValuesRaw) ? currentValuesRaw : [];
    let newValues = [...currentValues];
    
    if (checked) {
      newValues.push(value);
    } else {
      newValues = newValues.filter((item) => item !== value);
    }

    updateQuestionnaireField(category, field, newValues);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      // Map internal questionnaire categories to the API required categories
      const formattedQuestionnaire = {
        // Required by API
        diningPreferences: {}, // Empty but valid JSON
        socialPreferences: {
          ...questionnaire.socialStyle
        },
        atmospherePreferences: {}, // Empty but valid JSON
        interests: {
          ...questionnaire.leisurePreferences
        },
        dietaryRestrictions: {}, // Empty but valid JSON
        
        // Keep original categories too
        personalityTraits: questionnaire.personalityTraits,
        socialStyle: questionnaire.socialStyle,
        communicationStyle: questionnaire.communicationStyle,
        lifeValues: questionnaire.lifeValues,
        leisurePreferences: questionnaire.leisurePreferences,
      };
      
      onUpdate(formattedQuestionnaire);
      onNext();
    }, 500);
  };

  // Define all questions as separate components/configs, organized by answer type
  const questions = [
    // Introduction slide
    {
      type: "intro",
      title: "Your Personality Profile",
      description: "Let's get to know you better through these personality questions. Each question will help us match you with compatible dining companions.",
      render: () => (
        <div className="flex flex-col items-center justify-center space-y-8 py-12">
          <div className="text-center space-y-4">
            <h2 className={`${isTablet ? 'text-4xl' : 'text-3xl'} font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}>
              Your Personality Profile
            </h2>
            <p className={`text-muted-foreground max-w-lg mx-auto ${isTablet ? 'text-xl' : 'text-lg'}`}>
              Let's get to know you better through these personality questions. Your answers will help us match you with compatible dining companions.
            </p>
          </div>
          <Button 
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className={`mt-6 ${isTablet ? 'text-lg py-6 px-8' : ''}`}
            size="lg"
          >
            Begin Questionnaire
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    
    // SLIDER QUESTIONS
    // Adaptability
    {
      type: "slider",
      category: "personalityTraits",
      field: "adaptability",
      title: "Adaptability",
      question: "How adaptable are you to unexpected changes in plans?",
      min: 1,
      max: 5,
      step: 1,
      labels: ["Very resistant", "Somewhat resistant", "Neutral", "Somewhat flexible", "Very flexible"],
    },
    // Comfort with Strangers
    {
      type: "slider",
      category: "socialStyle",
      field: "comfortWithStrangers",
      title: "Meeting New People",
      question: "How comfortable are you meeting new people?",
      min: 1,
      max: 5,
      step: 1,
      labels: ["Very nervous", "Slightly anxious", "Neutral", "Comfortable", "Very comfortable"],
    },
    // Openness to New Ideas
    {
      type: "slider",
      category: "lifeValues",
      field: "growthMindset",
      title: "Openness to New Ideas",
      question: "How comfortable are you with challenging your own perspectives?",
      min: 1,
      max: 5,
      step: 1,
      labels: ["Uncomfortable", "Somewhat resistant", "Neutral", "Somewhat open", "Very open"],
    },
    // Punctuality
    {
      type: "slider",
      category: "socialStyle",
      field: "socialBoundaries",
      title: "Punctuality",
      question: "How important is punctuality to you when meeting with others?",
      min: 1,
      max: 5,
      step: 1,
      labels: ["Not important", "Somewhat flexible", "Balanced", "Somewhat strict", "Very strict"],
    },
    // Emotional Awareness
    {
      type: "slider",
      category: "communicationStyle",
      field: "emotionalAwareness",
      title: "Emotional Awareness",
      question: "How aware are you of your own emotions during conversations?",
      min: 1,
      max: 5,
      step: 1,
      labels: ["Not very aware", "Somewhat unaware", "Moderate awareness", "Fairly aware", "Highly aware"],
    },
    
    // RADIO QUESTIONS
    // Decision Making Style
    {
      type: "radio",
      category: "personalityTraits",
      field: "decisionMakingStyle",
      title: "Decision Making",
      question: "How do you typically make important decisions?",
      options: [
        { value: "analytical", label: "Analytical (weighing pros and cons)" },
        { value: "intuitive", label: "Intuitive (trusting gut feeling)" },
        { value: "consultative", label: "Consultative (asking others' opinions)" },
        { value: "spontaneous", label: "Spontaneous (deciding in the moment)" },
      ]
    },
    // Planning Style
    {
      type: "radio",
      category: "personalityTraits",
      field: "planningStyle",
      title: "Planning Style",
      question: "Which best describes your planning style?",
      options: [
        { value: "planner", label: "Planner (detailed itineraries)" },
        { value: "balanced", label: "Balanced (some planning, some spontaneity)" },
        { value: "flexible", label: "Flexible (minimal planning)" },
      ]
    },
    // Risk Taking
    {
      type: "radio",
      category: "personalityTraits",
      field: "risktakingLevel",
      title: "New Experiences",
      question: "How would you describe your approach to trying new things?",
      options: [
        { value: "conservative", label: "Conservative (prefer the familiar)" },
        { value: "moderate", label: "Moderate (occasionally try new things)" },
        { value: "adventurous", label: "Adventurous (love trying new things)" },
      ]
    },
    // Group Size
    {
      type: "radio",
      category: "socialStyle",
      field: "preferredGroupSize",
      title: "Social Settings",
      question: "What size social group do you prefer?",
      options: [
        { value: "small", label: "Small (2-3 people)" },
        { value: "medium", label: "Medium (4-6 people)" },
      ]
    },
    // Conversation Style
    {
      type: "radio",
      category: "socialStyle",
      field: "conversationStyle",
      title: "Conversation Style",
      question: "In conversations, are you more of a:",
      options: [
        { value: "listener", label: "Listener" },
        { value: "balanced", label: "Balanced" },
        { value: "talker", label: "Yapper" },
      ]
    },
    // Social Energy
    {
      type: "radio",
      category: "socialStyle",
      field: "socialEnergy",
      title: "Social Energy",
      question: "How would you describe your social energy?",
      options: [
        { value: "introvert", label: "Introvert (need alone time to recharge)" },
        { value: "ambivert", label: "Ambivert (balance of both)" },
        { value: "extrovert", label: "Extrovert (energized by socializing)" },
      ]
    },
    // Communication Style
    {
      type: "radio",
      category: "communicationStyle",
      field: "communicationPreference",
      title: "Communication Style",
      question: "How would you describe your communication style?",
      options: [
        { value: "direct", label: "Direct (straightforward, to the point)" },
        { value: "thoughtful", label: "Thoughtful (careful with words)" },
        { value: "emotional", label: "Emotional (expressive, passionate)" },
        { value: "factual", label: "Factual (focused on information)" },
      ]
    },
    // Weekend Preference
    {
      type: "radio",
      category: "leisurePreferences",
      field: "weekendPreference",
      title: "Weekend Activities",
      question: "How do you prefer to spend your weekends?",
      options: [
        { value: "active", label: "Active (outdoors, exploring, busy)" },
        { value: "relaxed", label: "Relaxed (low-key, restful activities)" },
        { value: "balanced", label: "Balanced (mix of activity and relaxation)" },
      ]
    },
    // Learning Style
    {
      type: "radio",
      category: "personalityTraits",
      field: "learningStyle",
      title: "Learning Style",
      question: "How do you tend to learn new information most effectively?",
      options: [
        { value: "visual", label: "Visual (through images, diagrams, demonstrations)" },
        { value: "auditory", label: "Auditory (through listening and discussion)" },
        { value: "kinesthetic", label: "Kinesthetic (through hands-on practice)" },
        { value: "reading", label: "Reading/Writing (through text and notes)" },
      ]
    },
    // Problem Solving Approach
    {
      type: "radio",
      category: "personalityTraits",
      field: "problemSolvingApproach",
      title: "Problem-Solving Approach",
      question: "How do you typically approach solving complex problems?",
      options: [
        { value: "systematic", label: "Systematic (methodical, step-by-step)" },
        { value: "creative", label: "Creative (thinking outside the box)" },
        { value: "collaborative", label: "Collaborative (seeking others' input)" },
        { value: "intuitive", label: "Intuitive (going with gut feelings)" },
      ]
    },
    // Time With Friends
    {
      type: "radio",
      category: "socialStyle",
      field: "timeWithFriends",
      title: "Social Frequency",
      question: "How often do you prefer to spend time with friends?",
      options: [
        { value: "daily", label: "Daily (constant social interaction)" },
        { value: "weekly", label: "Weekly (regular get-togethers)" },
        { value: "monthly", label: "Monthly (occasional gatherings)" },
        { value: "occasionally", label: "Occasionally (when the mood strikes)" },
      ]
    },
    // Travel Frequency
    {
      type: "radio",
      category: "leisurePreferences",
      field: "travelFrequency",
      title: "Travel Habits",
      question: "How often do you like to travel or explore new places?",
      options: [
        { value: "rarely", label: "Rarely (prefer staying close to home)" },
        { value: "occasionally", label: "Occasionally (a few times a year)" },
        { value: "regularly", label: "Regularly (frequent planned trips)" },
        { value: "whenever", label: "Whenever possible (prioritize new experiences)" },
      ]
    },
    // Feedback Style
    {
      type: "radio",
      category: "communicationStyle",
      field: "feedbackStyle",
      title: "Giving Feedback",
      question: "How do you prefer to give feedback to others?",
      options: [
        { value: "direct", label: "Direct (straightforward, no sugar-coating)" },
        { value: "gentle", label: "Gentle (diplomatic, mindful of feelings)" },
        { value: "actionable", label: "Actionable (focused on specific improvements)" },
        { value: "questioning", label: "Questioning (using inquiries to guide)" },
      ]
    },
    
    // CHECKBOX QUESTIONS
    // Core Values
    {
      type: "checkbox",
      category: "lifeValues",
      field: "coreValues",
      title: "Core Values",
      question: "Which values are most important to you? (Select all that apply)",
      options: [
        "Family", "Achievement", "Independence", "Creativity", 
        "Adventure", "Community", "Knowledge", "Loyalty",
        "Honesty", "Balance", "Growth", "Security",
        "Humor", "Spirituality", "Compassion", "Tradition",
      ]
    },
    // Life Goals
    {
      type: "checkbox",
      category: "lifeValues",
      field: "lifeGoals",
      title: "Life Goals",
      question: "Which of these best represent your current life goals? (Select all that apply)",
      options: [
        "Career advancement", "Personal growth", "Travel and exploration", 
        "Finding a partner", "Building a family", "Making a difference",
        "Financial security", "Skill mastery", "Creative expression", 
        "Building community", "Learning new things", "Health and wellness",
      ]
    },
    // Activities
    {
      type: "checkbox",
      category: "leisurePreferences",
      field: "activities",
      title: "Leisure Activities",
      question: "Which activities do you enjoy? (Select all that apply)",
      options: [
        "Reading", "Outdoor adventures", "Movies/TV shows", "Music events",
        "Art and museums", "Sports and fitness", "Volunteering", "Cooking",
        "Traveling", "Board games", "Video games", "Dancing",
        "Photography", "Wine tasting", "Going out", "Golf/Tennis",
      ]
    },
    // Important Qualities
    {
      type: "checkbox",
      category: "lifeValues",
      field: "importantQualities",
      title: "Important Qualities",
      question: "What qualities do you value most in other people? (Select all that apply)",
      options: [
        "Honesty", "Humor", "Intelligence", "Kindness",
        "Reliability", "Ambition", "Creativity", "Empathy",
        "Confidence", "Humility", "Optimism", "Open-mindedness",
        "Authenticity", "Thoughtfulness", "Assertiveness", "Patience",
      ]
    },
    // Deal Breakers
    {
      type: "checkbox",
      category: "lifeValues",
      field: "dealBreakers",
      title: "Relationship Deal Breakers",
      question: "Which of these would be deal breakers for you in new friendships? (Select all that apply)",
      options: [
        "Rudeness", "Closed-mindedness", "Unreliability", "Poor communication",
        "Negativity", "Dishonesty", "Selfishness", "Judgmental attitudes",
        "Disrespect", "Controlling behavior", "Lack of empathy", "Passive aggressiveness",
      ]
    },
    
    // Professional Occupation
    {
      type: "radio",
      category: "lifeValues",
      field: "occupation",
      title: "Professional Occupation",
      question: "What is your current profession?",
      options: [
        { value: "healthcare", label: "Healthcare (Nurse, Doctor, Therapist, etc.)" },
        { value: "education", label: "Education (Teacher, Professor, Tutor)" },
        { value: "tech", label: "Tech (Developer, IT, Support)" },
        { value: "retail", label: "Retail or Service Industry" },
        { value: "office_admin", label: "Office Administration" },
        { value: "marketing_sales", label: "Marketing or Sales" },
        { value: "creative", label: "Creative (Design, Writing, Art)" },
        { value: "hospitality", label: "Hospitality or Food Service" },
        { value: "finance", label: "Finance or Banking" },
        { value: "trades", label: "Skilled Trades (Electrician, Plumber, etc.)" },
        { value: "government", label: "Government or Public Service" },
        { value: "manufacturing", label: "Manufacturing or Production" },
        { value: "non_profit", label: "Non-Profit or Social Work" },
        { value: "student", label: "Student" },
        { value: "self_employed", label: "Self-Employed or Freelancer" },
        { value: "entertainment", label: "Entertainment or Media" },
        { value: "customer_service", label: "Customer Service" },
        { value: "gig_economy", label: "Gig Economy Worker" },
        { value: "other", label: "Other Profession" }
      ]
    },
    
    // Final slide
    {
      type: "final",
      title: "All Done!",
      description: "Thanks for sharing your preferences with us. We'll use this information to match you with compatible dining companions.",
      render: () => (
        <div className="flex flex-col items-center justify-center space-y-6 py-12">
          <div className="text-center space-y-4">
            <h2 className={`${isTablet ? 'text-4xl' : 'text-3xl'} font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}>
              All Done!
            </h2>
            <p className={`text-muted-foreground max-w-lg mx-auto ${isTablet ? 'text-xl' : 'text-lg'}`}>
              Thanks for sharing your personality profile with us. This will help us match you with compatible dining companions.
            </p>
          </div>
          <Button 
            onClick={handleSubmit}
            className={`mt-6 ${isTablet ? 'text-lg py-6 px-8' : ''}`}
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Complete Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )
    },
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / (questions.length - 1)) * 100;

  // Get the current slide type category for display in progress
  const getCurrentCategory = () => {
    if (currentQuestion.type === 'intro' || currentQuestion.type === 'final') {
      return '';
    }
    
    if (currentQuestion.type === 'radio') {
      return 'Choose One';
    }
    
    if (currentQuestion.type === 'slider') {
      return 'Scale';
    }
    
    if (currentQuestion.type === 'checkbox') {
      return 'Select Multiple';
    }
    
    return '';
  };

  // Function to get the current value for a question
  const getCurrentValue = (category: string, field: string): any => {
    if (!category || !field) return null;
    
    try {
      const categoryObj = questionnaire[category as keyof typeof questionnaire];
      if (!categoryObj) return null;
      
      return categoryObj[field as keyof typeof categoryObj] ?? null;
    } catch (err) {
      console.warn(`Error getting value for ${category}.${field}`, err);
      return null;
    }
  };

  // Function to check if the current question has a valid value and enable/disable next button
  const canProceed = () => {
    if (currentQuestion.type === 'intro' || currentQuestion.type === 'final') {
      return true;
    }
    
    if (!currentQuestion.category || !currentQuestion.field) {
      return true;
    }
    
    const value = getCurrentValue(currentQuestion.category, currentQuestion.field);
    
    if (currentQuestion.type === 'checkbox') {
      // Initialize empty array for checkbox questions if not set
      if (value === null) {
        updateQuestionnaireField(currentQuestion.category, currentQuestion.field, []);
        return false;
      }
      return Array.isArray(value) && value.length > 0;
    }
    
    return value !== null;
  };

  // Render the current question
  const renderQuestion = () => {
    if (currentQuestion.type === 'intro' || currentQuestion.type === 'final') {
      return currentQuestion.render?.();
    }

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className={`${isTablet ? 'text-3xl' : 'text-2xl'} font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}>
            {currentQuestion.title}
          </h2>
          <p className={`text-muted-foreground ${isTablet ? 'text-lg' : ''}`}>
            {currentQuestion.question}
          </p>
        </div>

        <div className={`p-6 rounded-lg border border-primary/10 bg-primary/5 ${isTablet ? 'my-8' : 'my-6'}`}>
          {/* Radio Question */}
          {currentQuestion.type === 'radio' && currentQuestion.options && (
            <RadioGroup
              value={String(getCurrentValue(currentQuestion.category, currentQuestion.field) || "")}
              onValueChange={(value) =>
                updateQuestionnaireField(
                  currentQuestion.category,
                  currentQuestion.field,
                  value
                )
              }
            >
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option: any) => {
                  const optionValue = typeof option === 'string' ? option : option.value;
                  const optionLabel = typeof option === 'string' ? option : option.label;
                  
                  return (
                    <div 
                      key={optionValue} 
                      className={`flex items-center space-x-2 p-3 rounded-md border border-border/50 ${getCurrentValue(currentQuestion.category, currentQuestion.field) === optionValue ? 'bg-primary/10 border-primary/30' : 'bg-card hover:bg-accent/50'}`}
                    >
                      <RadioGroupItem value={optionValue} id={`option-${optionValue}`} />
                      <Label 
                        htmlFor={`option-${optionValue}`}
                        className={`${isTablet ? 'text-base' : ''} cursor-pointer w-full`}
                      >
                        {optionLabel}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          )}

          {/* Slider Question */}
          {currentQuestion.type === 'slider' && currentQuestion.labels && (
            <div className="px-2 py-4">
              <Slider
                value={[Number(getCurrentValue(currentQuestion.category, currentQuestion.field) || 3)]}
                min={currentQuestion.min || 1}
                max={currentQuestion.max || 5}
                step={currentQuestion.step || 1}
                onValueChange={(value) =>
                  updateQuestionnaireField(
                    currentQuestion.category,
                    currentQuestion.field,
                    value[0]
                  )
                }
                className="my-6"
              />
              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                {currentQuestion.labels.map((label: string, index: number) => (
                  <div 
                    key={index} 
                    className={`text-center px-1 ${getCurrentValue(currentQuestion.category, currentQuestion.field) === index + 1 ? 'text-primary font-medium' : ''}`}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkbox Question */}
          {currentQuestion.type === 'checkbox' && currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(currentQuestion.options as string[]).map((option: string) => {
                // Initialize array if undefined
                if (getCurrentValue(currentQuestion.category, currentQuestion.field) === null) {
                  updateQuestionnaireField(currentQuestion.category, currentQuestion.field, []);
                }
                
                const currentValues = Array.isArray(getCurrentValue(currentQuestion.category, currentQuestion.field)) 
                  ? getCurrentValue(currentQuestion.category, currentQuestion.field) as string[] 
                  : [];
                
                return (
                  <div 
                    key={option} 
                    className={`flex items-center space-x-2 p-3 rounded-md border border-border/50 ${currentValues.includes(option) ? 'bg-primary/10 border-primary/30' : 'bg-card hover:bg-accent/50'}`}
                  >
                    <Checkbox
                      id={`${currentQuestion.field}-${option}`}
                      checked={currentValues.includes(option)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          currentQuestion.category,
                          currentQuestion.field,
                          option,
                          checked as boolean
                        )
                      }
                    />
                    <label
                      htmlFor={`${currentQuestion.field}-${option}`}
                      className={`${isTablet ? 'text-base' : 'text-sm'} leading-none cursor-pointer w-full`}
                    >
                      {option}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress bar - only show for actual questions, not intro/final */}
      {currentQuestion.type !== 'intro' && currentQuestion.type !== 'final' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <div>
              {getCurrentCategory() && (
                <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {getCurrentCategory()}
                </span>
              )}
            </div>
            <div>
              Question {currentQuestionIndex} of {questions.length - 2}
            </div>
          </div>
          <Progress value={progress} className="h-2 w-full" />
        </div>
      )}

      {/* Current question */}
      {renderQuestion()}

      {/* Navigation buttons - only show for questions, not intro/final */}
      {currentQuestion.type !== 'intro' && currentQuestion.type !== 'final' && (
        <div className="pt-6 flex justify-between">
          <Button 
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)} 
            variant="outline"
            className={isTablet ? 'text-base px-6' : ''}
            disabled={currentQuestionIndex === 1} // Don't allow back from first question to intro
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className={isTablet ? 'text-base px-6' : ''}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Back button for intro slide */}
      {currentQuestion.type === 'intro' && (
        <div className="pt-4 flex justify-start">
          <Button 
            onClick={onBack} 
            variant="outline"
            className={isTablet ? 'text-base py-6 px-8' : ''}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}