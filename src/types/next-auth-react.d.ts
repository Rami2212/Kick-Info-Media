declare module "next-auth/react" {
  import type { ReactElement, ReactNode } from "react";
  import type { Session } from "next-auth";

  export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

  export function useSession(): {
    data: Session | null;
    status: SessionStatus;
  };

  export function signIn(
    provider?: string,
    options?: Record<string, unknown>,
    authorizationParams?: Record<string, string | number | boolean>,
  ): Promise<{ error?: string; status?: number; ok?: boolean; url?: string | null } | undefined>;

  export function signOut(options?: {
    callbackUrl?: string;
    redirect?: boolean;
  }): Promise<{ url?: string } | void>;

  export function SessionProvider(props: {
    children: ReactNode;
    session?: Session | null;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
  }): ReactElement;
}
