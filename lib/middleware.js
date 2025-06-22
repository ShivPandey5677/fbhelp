import { verifyToken } from './auth'

export function withAuth(handler) {
  return async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.userId = decoded.userId
    return handler(req, res)
  }
}