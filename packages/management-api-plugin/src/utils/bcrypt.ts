import bcrypt from "bcrypt";

export function encrypt(password: string, salt: string) {
  return new Promise<string>((resolve, reject) => {
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) reject(err);
      resolve(hash);
    });
  });
}

export function genSalt(rounds = 10) {
  return new Promise<string>((resolve, reject) => {
    bcrypt.genSalt(rounds, (err, salt) => {
      if (err) reject(err);
      resolve(salt);
    });
  });
}
