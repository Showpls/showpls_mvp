import { InsertOrder } from "@shared/schema";

export function parseLocation(location: InsertOrder["location"]) {
  return {
    lat: location.lat,
    lng: location.lng,
    address:
      typeof location.address === "string" ? location.address : undefined,
  };
}

export function parseMilestones(milestones?: InsertOrder["milestones"]) {
  if (!milestones) return undefined;

  return {
    atLocation: parseMilestone(milestones.atLocation),
    draftContent: parseMilestone(milestones.draftContent),
    final: parseMilestone(milestones.final),
  };
}

function parseMilestone(milestone?: {
  paid: boolean;
  amount: string;
  paidAt?: unknown;
}) {
  if (!milestone) return undefined;

  return {
    paid: milestone.paid,
    amount: milestone.amount,
    paidAt: typeof milestone.paidAt === "string" ? milestone.paidAt : undefined,
  };
}
