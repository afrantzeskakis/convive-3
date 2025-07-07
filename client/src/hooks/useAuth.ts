import { useAuth as useAuthContext } from "@/contexts/AuthContextProvider";

// Re-export the hook for convenience
export function useAuth() {
  return useAuthContext();
}

// Export individual parts of auth functionality
export function useLogin() {
  const { login } = useAuthContext();
  return login;
}

export function useSignup() {
  const { signup } = useAuthContext();
  return signup;
}

export function useLogout() {
  const { logout } = useAuthContext();
  return logout;
}

export function useUser() {
  const { user } = useAuthContext();
  return user;
}