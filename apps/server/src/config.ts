import { FileSystemCache } from "file-system-cache";
import { AuthProps } from "shared/types";

const cache = new FileSystemCache({
  basePath: "~/.toad/config",
  ns: "toad-server",
});

export const config = cache.getSync("config") as AuthProps | undefined;

export const getAuth = () => cache.getSync("auth");

export const setAuth = (auth: any) => cache.setSync("auth", auth);

export const getSecret = () => cache.getSync("secret");

export const setSecret = (secret: any) => cache.setSync("secret", secret);

export const getDomain = () => cache.getSync("domain");

export const setDomain = (domain: any) => cache.setSync("domain", domain);
