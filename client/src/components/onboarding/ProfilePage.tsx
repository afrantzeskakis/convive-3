import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters"),
  age: z.coerce.number().min(18, "You must be at least 18 years old").max(120, "Please enter a valid age"),
  gender: z.string().min(1, "Please select a gender"),
  occupation: z.string().min(1, "Occupation is required"),
  lookingFor: z.string().min(1, "Please select what you're looking for"),
  profilePicture: z.string().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfilePageProps {
  initialData: any;
  onUpdate: (data: any) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function ProfilePage({ initialData, onUpdate, onSubmit, onBack }: ProfilePageProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.profilePicture);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName || "",
      bio: initialData.bio || "",
      age: initialData.age || "",
      gender: initialData.gender || "",
      occupation: initialData.occupation || "",
      lookingFor: initialData.lookingFor || "",
      profilePicture: initialData.profilePicture || null,
    },
  });

  // Update parent when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      onUpdate(value);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onUpdate]);

  const onFormSubmit = (data: ProfileFormValues) => {
    onUpdate(data);
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Complete Your Profile</h2>
        <p className="text-muted-foreground">
          Tell us more about yourself to help others get to know you
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" min={18} max={120} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lookingFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>I'm looking for...</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select what you're looking for" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new-friends">New friends</SelectItem>
                      <SelectItem value="dining-buddies">Dining buddies</SelectItem>
                      <SelectItem value="networking">Professional networking</SelectItem>
                      <SelectItem value="date">Potential dates</SelectItem>
                      <SelectItem value="everything">All of the above</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a bit about yourself..."
                      className="h-24 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share some details about your interests, hobbies, and what makes a good dining companion for you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profilePicture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <div className="flex flex-col items-center space-y-4">
                    {imagePreview && (
                      <div className="relative h-32 w-32 overflow-hidden rounded-full">
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <FormControl>
                      <div className="flex flex-col items-center">
                        <Label
                          htmlFor="picture"
                          className="cursor-pointer rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                        >
                          {imagePreview ? "Change Picture" : "Upload Picture"}
                        </Label>
                        <Input
                          id="picture"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64String = reader.result as string;
                                setImagePreview(base64String);
                                field.onChange(base64String);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button onClick={onBack} type="button" variant="outline">
              Back
            </Button>
            <Button type="submit">Complete Profile</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}