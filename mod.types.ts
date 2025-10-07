/**
 * Options for initializing the DDFramework.
 */
export type DDFrameworkOptions = {
  /** The unique identifier for the application. */
  applicationId: string;
  /** The public key associated with the application. */
  publicKey: string;
  /** The client ID for OAuth2 authentication. */
  clientId: string;
  /** The client secret for OAuth2 authentication. */
  clientSecret?: string;
  /** The token used for authentication. */
  token: string;

  /** Authorized Developers for Restricted Interactions */
  developers: string[];

  /** Error Handler */
  errorHandler: (error: Error | string, context: unknown | Error) => void;
};
