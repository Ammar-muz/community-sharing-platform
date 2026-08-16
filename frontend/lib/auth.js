import jwt from "jsonwebtoken";

export function verifyAuth(request) {
  const header = request.headers.get("Authorization") || "";
  const token = header.replace("Bearer ", "").trim();

  if (!token) {
    return { error: { status: 401, msg: "No token, access denied" } };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded };
  } catch (err) {
    return { error: { status: 401, msg: "Token is not valid" } };
  }
}

export function requireAdmin(user) {
  if (user && user.role === "admin") {
    return null;
  }
  return { status: 403, msg: "Access denied. Admins only." };
}

export function jsonError(error, status = 500) {
  return Response.json({ msg: error.msg || "Server error" }, { status: error.status || status });
}