import { AuthProps } from "./types";

export function validateAuthProps(
  authProps?: Partial<AuthProps>
): authProps is AuthProps {
  if (!authProps) {
    return false;
  }

  const { token, domain, secret } = authProps;

  if (!token || !domain || !secret) {
    return false;
  }

  return true;
}
