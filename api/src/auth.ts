import { createHash, randomBytes } from "node:crypto"
import type { FastifyReply, FastifyRequest } from "fastify"
import { config } from "./config.js"
import { prisma } from "./db.js"

export const SESSION_COOKIE = "fineduca_session"

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url")
}

export function setSessionCookie(reply: FastifyReply, token: string) {
  reply.setCookie(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: config.SESSION_TTL_HOURS * 60 * 60,
  })
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/", sameSite: "strict" })
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.cookies[SESSION_COOKIE]
  if (!token) {
    return reply.code(401).send({
      error: "UNAUTHENTICATED",
      message: "Entre na sua conta para continuar.",
    })
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: { userId: true, expiresAt: true },
  })

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.deleteMany({
        where: { tokenHash: hashSessionToken(token) },
      })
    }
    clearSessionCookie(reply)
    return reply.code(401).send({
      error: "UNAUTHENTICATED",
      message: "Sua sessão expirou. Entre novamente.",
    })
  }

  request.userId = session.userId
}

export function authenticatedUserId(request: FastifyRequest) {
  if (!request.userId)
    throw new Error("Middleware de autenticação não executado.")
  return request.userId
}
