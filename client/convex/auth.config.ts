const clerkJwtIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!clerkJwtIssuerDomain) {
  throw new Error(
    "CLERK_JWT_ISSUER_DOMAIN is not set. Add it to your Convex environment variables: npx convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-frontend-api-url>"
  );
}

const authConfig = {
  providers: [
    {
      domain: clerkJwtIssuerDomain,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
