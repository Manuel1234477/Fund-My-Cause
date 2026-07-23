import jwt from "jsonwebtoken";

/**
 * Authentication service for JWT token generation and verification
 */
export class AuthService {
  private jwtSecret: string;
  private tokenExpiry: string;

  constructor(jwtSecret: string = process.env.JWT_SECRET || "your-secret-key", tokenExpiry: string = "24h") {
    this.jwtSecret = jwtSecret;
    this.tokenExpiry = tokenExpiry;
  }

  /**
   * Generate JWT token for a user
   */
  generateToken(address: string): string {
    try {
      const token = jwt.sign(
        {
          address,
          iat: Math.floor(Date.now() / 1000),
        },
        this.jwtSecret,
        {
          expiresIn: this.tokenExpiry as jwt.SignOptions["expiresIn"],
          algorithm: "HS256",
        }
      );

      return token;
    } catch (error) {
      console.error("Error generating token:", error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { address: string; iat: number } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ["HS256"],
      });

      return decoded as { address: string; iat: number };
    } catch (error) {
      console.error("Error verifying token:", error);
      return null;
    }
  }

  /**
   * Extract token from authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    return parts[1];
  }

  /**
   * Decode token without verification (for initial inspection)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  }

  /**
   * Create a message for signature verification
   */
  createSignatureMessage(address: string, nonce: string): string {
    return `Sign this message to authenticate with Fund My Cause\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      console.error("Error getting token expiry:", error);
      return null;
    }
  }
}
