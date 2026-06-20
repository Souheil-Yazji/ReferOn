export type ReferralStatus =
  | "draft"
  | "previewed"
  | "selected_specialist"
  | "pending"
  | "sent"
  | "approved"
  | "rejected";

const TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  draft: ["previewed"],
  previewed: ["selected_specialist", "draft"],
  selected_specialist: ["draft", "pending"],
  pending: ["sent"],
  sent: ["approved", "rejected"],
  approved: [],
  rejected: ["draft"],
};

export function canTransition(
  from: ReferralStatus,
  to: ReferralStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Asserts the transition is valid. Throws a structured error if not.
 */
export function assertTransition(from: ReferralStatus, to: ReferralStatus) {
  if (!canTransition(from, to)) {
    throw new StatusTransitionError(from, to);
  }
}

export class StatusTransitionError extends Error {
  readonly statusCode = 409;
  constructor(from: ReferralStatus, to: ReferralStatus) {
    super(
      `Cannot transition referral from '${from}' to '${to}'. Allowed from '${from}': [${TRANSITIONS[from].join(", ")}]`
    );
    this.name = "StatusTransitionError";
  }
}
