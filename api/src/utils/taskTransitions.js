// Pure business rules for task status transitions.
// Kept framework-free so they can be unit tested without a database.

// Allowed transitions for managers / admins.
const MANAGER_TRANSITIONS = {
  TODO: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["DONE", "BLOCKED"],
  BLOCKED: ["IN_PROGRESS"],
  DONE: [],
};

// Members may only progress their own tasks linearly.
const MEMBER_TRANSITIONS = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE"],
  BLOCKED: [],
  DONE: [],
};

const isValidTransition = (role, currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return true;
  const table = String(role).toUpperCase() === "MEMBER"
    ? MEMBER_TRANSITIONS
    : MANAGER_TRANSITIONS;
  const allowed = table[currentStatus] || [];
  return allowed.includes(nextStatus);
};

// Terminal states that can never be left.
const isTerminal = (status) => status === "DONE";

module.exports = {
  MANAGER_TRANSITIONS,
  MEMBER_TRANSITIONS,
  isValidTransition,
  isTerminal,
};
