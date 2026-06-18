import config from 'config';

interface ServerConfig {
  port: number;
  nodeEnv: string;
}

interface MongodbConfig {
  uri: string;
}

interface GithubConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface FrontendConfig {
  url: string;
}

export const serverConfig = config.get<ServerConfig>('server');
export const mongodbConfig = config.get<MongodbConfig>('mongodb');
export const githubConfig = config.get<GithubConfig>('github');
export const jwtConfig = config.get<JwtConfig>('jwt');
export const frontendConfig = config.get<FrontendConfig>('frontend');
