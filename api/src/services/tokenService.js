const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { generateJWT } = require("../utils/helper");
const redis = require("../config/redis").redis;
const { getRoleCode } = require("../utils/permissions");
const { ErrorHandler } = require("../utils/utils");
const { User, Role } = require("../models");

const ACCESS_TTL = process.env.JWT_EXPIRES_IN || "5m";
const REFRESH_TTL_SECONDS = parseInt(
  process.env.REFRESH_TOKEN_TTL_SECONDS || "1800",
  10
);

// Build a short-lived access token. Payload always carries the stable
// tenant + role identity so services never trust client-supplied org/role.
// The role identity is derived from the persisted Role record (role_id/code),
// never from a free-text column on users.
const buildAccessToken = (user) => {
  const roleId =
    user.role_id || (user.roleRecord && user.roleRecord.id) || null;
  const roleCode =
    (user.roleRecord && user.roleRecord.code) || getRoleCode(user.role) || null;

  const payload = {
    userId: user.id,
    id: user.id, // kept for legacy modules
    orgId: user.org_id || null,
    roleId,
    role: roleCode,
    roles: roleCode ? [roleCode] : [], // kept for legacy modules
  };

  return generateJWT(payload, ACCESS_TTL);
};

const storeRefreshToken = async (userId, jti) => {
  try {
    await redis.set(`refresh:${jti}`, userId, REFRESH_TTL_SECONDS);
    return true;
  } catch (e) {
    console.error("Redis: failed to store refresh token", e.message);
    return false;
  }
};

// Returns { userId } when the token is still valid, or null when it was
// already consumed / never issued. Errors (e.g. Redis down) are reported
// via `error: true` so callers can gracefully fall back.
const consumeRefreshToken = async (jti) => {
  try {
    const userId = await redis.get(`refresh:${jti}`);
    if (!userId) return { userId: null };
    await redis.remove(`refresh:${jti}`);
    return { userId };
  } catch (e) {
    console.error("Redis: failed to consume refresh token", e.message);
    return { userId: null, error: true };
  }
};

// Issue a fresh access + refresh pair and persist the refresh token.
const issueTokenPair = async (user) => {
  const accessToken = buildAccessToken(user);

  const jti = uuidv4();
  const refreshToken = jwt.sign(
    { userId: user.id, jti },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: `${REFRESH_TTL_SECONDS}s` }
  );

  await storeRefreshToken(user.id, jti);

  return { accessToken, refreshToken };
};

// Refresh-token rotation. Validates signature + expiry, then revokes the
// presented token (single-use) before issuing a new pair.
const rotateRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ErrorHandler("Refresh token required", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (e) {
    throw new ErrorHandler("Invalid or expired refresh token", 403);
  }

  const { userId, jti } = decoded;

  const { userId: storedUserId, error } = await consumeRefreshToken(jti);

  // Fail closed: if we cannot confirm the revocation state (e.g. Redis is
  // unavailable), refuse to issue new tokens rather than silently skipping
  // the single-use rotation checks. This prevents a stolen refresh token
  // from being reused while the revocation store is unreachable.
  if (error) {
    throw new ErrorHandler("Unable to validate refresh token", 503);
  }

  // Token missing from Redis -> already consumed (reuse) or never issued.
  if (!storedUserId) {
    throw new ErrorHandler("Refresh token has been revoked or reused", 403);
  }
  if (storedUserId !== userId) {
    throw new ErrorHandler("Refresh token does not match the user", 403);
  }

  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: "roleRecord" }],
  });

  if (!user) {
    throw new ErrorHandler("User not found", 401);
  }

  return issueTokenPair(user);
};

module.exports = {
  ACCESS_TTL,
  REFRESH_TTL_SECONDS,
  buildAccessToken,
  issueTokenPair,
  rotateRefreshToken,
};
