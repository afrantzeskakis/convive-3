import { Button } from "../ui/button";
import { useDevice } from "../../hooks/useDevice";

interface WelcomePageProps {
  onNext: () => void;
}

export default function WelcomePage({ onNext }: WelcomePageProps) {
  const { isMobile, isTablet, isDesktop } = useDevice();

  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h2 
          className={`${isTablet ? 'text-3xl' : 'text-2xl'} font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}
        >
          Welcome to Convive!
        </h2>
        <p className={`text-muted-foreground ${isTablet ? 'text-lg' : ''}`}>
          We're excited to have you join our community of food lovers and social butterflies!
        </p>
      </div>

      <div
        className={`
          rounded-lg bg-primary/5 p-6 border border-primary/10
          ${isTablet ? 'my-8' : 'my-4'}
        `}
      >
        <h3 className={`font-semibold mb-3 ${isTablet ? 'text-xl' : 'text-lg'}`}>
          Here's what to expect:
        </h3>
        <ul 
          className={`
            space-y-4 list-disc pl-5 
            ${isTablet ? 'text-base' : 'text-sm'}
          `}
        >
          <li>
            <span className="font-medium">Personalized matchmaking</span>
            <p className="text-muted-foreground">
              We'll ask you questions about your dining preferences and social style to match you with compatible dining companions.
            </p>
          </li>
          <li>
            <span className="font-medium">Curated restaurant experiences</span>
            <p className="text-muted-foreground">
              Discover new restaurants that align with your tastes and preferences.
            </p>
          </li>
          <li>
            <span className="font-medium">Meet new people</span>
            <p className="text-muted-foreground">
              Connect with like-minded individuals who share your passion for good food and great conversation.
            </p>
          </li>
          <li>
            <span className="font-medium">Organize and join meetups</span>
            <p className="text-muted-foreground">
              Create your own dining events or join ones organized by others in the community.
            </p>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className={`font-semibold ${isTablet ? 'text-xl' : 'text-lg'}`}>
          The next steps:
        </h3>
        <ol 
          className={`
            space-y-2 list-decimal pl-5 
            ${isTablet ? 'text-base' : 'text-sm'}
          `}
        >
          <li><span className="text-primary font-medium">Select your city</span> so we can find nearby dining options</li>
          <li><span className="text-primary font-medium">Complete a brief questionnaire</span> about your preferences</li>
          <li><span className="text-primary font-medium">Create your profile</span> to help others get to know you</li>
        </ol>
      </div>

      <div className={`pt-6 ${isTablet ? 'pt-8' : ''}`}>
        <Button 
          onClick={onNext} 
          className={`w-full ${isTablet ? 'text-lg py-6' : ''}`}
        >
          Let's Get Started
        </Button>
      </div>
    </div>
  );
}