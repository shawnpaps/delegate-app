function getIdentityEmail(identity: {
  email?: string;
  preferredUsername?: string;
  nickname?: string;
}): string {
  return identity.email || identity.preferredUsername || identity.nickname || "";
}

function getIdentityName(identity: {
  name?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  preferredUsername?: string;
  nickname?: string;
}): string {
  const fullName = [identity.givenName, identity.familyName].filter(Boolean).join(" ");
  return identity.name || fullName || getIdentityEmail(identity);
}

async function findUser(ctx: any, authId: string, email: string) {
  const userByAuthId = await ctx.db
    .query("users")
    .withIndex("by_authId", (q: any) => q.eq("authId", authId))
    .first();

  if (userByAuthId || !email) {
    return userByAuthId;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();
}

export async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const authId = identity.tokenIdentifier;
  const email = getIdentityEmail(identity);

  return await findUser(ctx, authId, email);
}

export async function getOrCreateCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const authId = identity.tokenIdentifier;
  const email = getIdentityEmail(identity);
  const name = getIdentityName(identity);

  const user = await findUser(ctx, authId, email);

  if (!user) {
    const userId = await ctx.db.insert("users", {
      authId,
      email,
      name,
    });
    return await ctx.db.get(userId);
  }

  const patch: { authId?: string; email?: string; name?: string } = {};
  if (!user.authId) patch.authId = authId;
  if (email && user.email !== email) patch.email = email;
  if (name && (!user.name || user.name !== name)) patch.name = name;

  if (Object.keys(patch).length > 0) {
    await ctx.db.patch(user._id, patch);
    return await ctx.db.get(user._id);
  }

  return user;
}
