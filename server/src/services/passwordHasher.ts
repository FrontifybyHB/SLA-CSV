import bcrypt from "bcryptjs";

const DEFAULT_COST = 12;

export class PasswordHasher {
  constructor(private readonly cost: number = DEFAULT_COST) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.cost);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}