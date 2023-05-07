import { AuthProps } from "shared/types";

export function validateAuthProps(
  authProps: Partial<AuthProps>
): authProps is AuthProps {
  const { token, domain, secret } = authProps;

  if (!token || !domain || !secret) {
    return false;
  }

  return true;
}
