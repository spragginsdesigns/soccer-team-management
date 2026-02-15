import { internalMutation } from "./_generated/server";
import { generateSecureCode } from "./lib/access";

// One-time migration: backfill legacy teams with invite codes and owner membership records
export const backfillLegacyTeams = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allTeams = await ctx.db.query("teams").collect();
    const results: string[] = [];

    for (const team of allTeams) {
      // 1. Backfill missing invite codes
      if (!team.inviteCode) {
        let inviteCode = generateSecureCode();
        let attempts = 0;

        while (attempts < 10) {
          const existing = await ctx.db
            .query("teams")
            .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
            .first();

          if (!existing) break;
          inviteCode = generateSecureCode();
          attempts++;
        }

        await ctx.db.patch(team._id, {
          inviteCode,
          inviteCodeCreatedAt: Date.now(),
        });

        results.push(`Team "${team.name}": generated invite code ${inviteCode}`);
      }

      // 2. Backfill missing owner membership records
      if (team.userId) {
        // userId is stored as string in legacy teams, need to find the actual user
        const existingMembership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (q) =>
            q.eq("teamId", team._id).eq("userId", team.userId as any)
          )
          .first();

        if (!existingMembership) {
          await ctx.db.insert("teamMembers", {
            teamId: team._id,
            userId: team.userId as any,
            role: "owner",
            joinedAt: team.createdAt || Date.now(),
          });

          results.push(`Team "${team.name}": created owner membership for userId ${team.userId}`);
        }
      }
    }

    return results.length > 0 ? results : ["No legacy teams needed migration"];
  },
});
