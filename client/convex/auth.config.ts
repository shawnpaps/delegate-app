const clientId = process.env.WORKOS_CLIENT_ID;
if (!clientId) {
  throw new Error(
    "WORKOS_CLIENT_ID is not set. Add it to your Convex environment variables: npx convex env set WORKOS_CLIENT_ID <your-client-id>"
  );
}

const authConfig = {
  providers: [
    // WorkOS SSO tokens: iss = https://api.workos.com/, aud = clientId
    {
      type: "customJwt",
      issuer: "https://api.workos.com/",
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
    // WorkOS AuthKit (User Management) tokens: iss = https://api.workos.com/user_management/{clientId}
    {
      type: "customJwt",
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
  ],
};

export default authConfig;
