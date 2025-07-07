import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDevice } from '@/hooks/useDevice';
import WelcomePage from './WelcomePage';
import LocationPage from './LocationPage';
import QuestionnairePage from './QuestionnairePage';
import ProfilePage from './ProfilePage';
import { Progress } from '@/components/ui/progress';

// Import dining images
import diningImage1 from '../../assets/dining-image-1.svg';
import diningImage2 from '../../assets/dining-image-2.svg';
import diningImage3 from '../../assets/dining-image-3.svg';

// Define the steps of onboarding
const STEPS = ['welcome', 'location', 'questionnaire', 'profile'];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [data, setData] = useState<any>({
    city: null,
    questionnaire: {
      diningPreferences: {},
      socialPreferences: {},
      atmospherePreferences: {},
      interests: {},
      dietaryRestrictions: {}
    },
    profile: {
      fullName: '',
      bio: '',
      age: null,
      gender: '',
      occupation: '',
      lookingFor: '',
      profilePicture: null
    }
  });
  
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isTablet, isMobile, deviceType } = useDevice();
  
  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  // Redirect if onboarding already complete
  if (user.onboardingComplete) {
    navigate('/');
    return null;
  }
  
  const updateData = (stepData: any) => {
    setData((prevData: any) => ({ ...prevData, ...stepData }));
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLocationUpdate = (city: any) => {
    updateData({ city });
    goToNextStep();
  };

  const handleQuestionnaireUpdate = (questionnaire: any) => {
    // First update questionnaire data
    updateData({ questionnaire });
    
    // Then extract occupation from questionnaire and add it to profile data
    if (questionnaire.lifeValues && questionnaire.lifeValues.occupation) {
      setData((prevData: any) => ({
        ...prevData,
        profile: {
          ...prevData.profile,
          occupation: questionnaire.lifeValues.occupation
        }
      }));
    }
    
    goToNextStep();
  };

  const handleProfileUpdate = (profileInfo: any) => {
    updateData({ profile: profileInfo });
  };
  
  const handleCompleteOnboarding = async () => {
    try {
      // Update user with onboarding data
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: data.city,
          gender: data.profile.gender,
          age: data.profile.age,
          occupation: data.profile.occupation,
          bio: data.profile.bio,
          profilePicture: data.profile.profilePicture,
          lookingFor: data.profile.lookingFor,
          onboardingComplete: true
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Create user preferences
      // Ensure all preference objects are properly formed - empty objects are valid JSON
      const preferencesResponse = await fetch(`/api/users/${user.id}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          diningPreferences: data.questionnaire.diningPreferences || {},
          socialPreferences: data.questionnaire.socialPreferences || {},
          atmospherePreferences: data.questionnaire.atmospherePreferences || {},
          interests: data.questionnaire.interests || {},
          dietaryRestrictions: data.questionnaire.dietaryRestrictions || {}
        }),
        credentials: 'include'
      });
      
      if (!preferencesResponse.ok) {
        throw new Error('Failed to save preferences');
      }
      
      toast({
        title: 'Onboarding complete!',
        description: 'Your profile is all set up. You can now start using the platform.',
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col min-h-screen">
      <div className={`container mx-auto px-4 ${isMobile ? 'py-4' : isTablet ? 'py-8' : 'py-12'} flex-grow`}>
        <div className={`${isTablet ? 'max-w-4xl' : 'max-w-3xl'} mx-auto`}>
          <div className={`mb-${isTablet ? '10' : '8'}`}>
            <h1 
              className={`${isTablet ? 'text-4xl' : 'text-3xl'} font-bold text-center mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}
            >
              Complete Your Profile
            </h1>
            <Progress value={progressPercentage} className={`h-${isTablet ? '3' : '2'}`} />
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span className={isTablet ? 'text-base' : ''}>Step {currentStep + 1} of {STEPS.length}</span>
              <span className={`capitalize ${isTablet ? 'text-base' : ''}`}>{STEPS[currentStep]}</span>
            </div>
          </div>
          
          {currentStep < 3 && (
            <div className="mb-6">
              <img 
                src={currentStep === 0 ? diningImage1 : currentStep === 1 ? diningImage2 : diningImage3} 
                alt="People enjoying dinner" 
                className="w-full h-auto rounded-lg shadow-md object-cover"
                style={{ maxHeight: '250px' }}
              />
            </div>
          )}

          <div 
            className={`bg-card rounded-lg shadow-lg ${
              isTablet ? 'p-8 shadow-xl' : isMobile ? 'p-4' : 'p-6'
            }`}
          >
            {currentStep === 0 && (
              <WelcomePage 
                onNext={goToNextStep} 
              />
            )}
            
            {currentStep === 1 && (
              <LocationPage 
                initialCity={data.city}
                onUpdate={handleLocationUpdate}
                onBack={goToPreviousStep}
              />
            )}
            
            {currentStep === 2 && (
              <QuestionnairePage 
                onUpdate={handleQuestionnaireUpdate}
                onNext={goToNextStep}
                onBack={goToPreviousStep}
              />
            )}
            
            {currentStep === 3 && (
              <ProfilePage 
                initialData={data.profile}
                onUpdate={handleProfileUpdate}
                onSubmit={handleCompleteOnboarding}
                onBack={goToPreviousStep}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}