import { v4 } from "uuid";

/**
 * This is just a fake repo - no db or anything, so please
 * don't see this as any boilerplate material for your next
 * Flink app 😬
 */

type User = {
  id: string;
  username: string;
  salt: string;
  password: string;
};

export const users: User[] = [
  {
    id: "1",
    username: "bob@frost.se",
    salt: "$2b$10$yZCo7iAM6eiB.dXVdWHKZe",
    password: "$2b$10$yZCo7iAM6eiB.dXVdWHKZeHnqgYVUjflfgj4Fl8uYfJRoBdbebt2O", // == password
  },
  {
    id: "2",
    username: "alice@frost.se",
    salt: "$2b$10$WDhg0w3KcU0rIsK/xcU9uO",
    password: "",
  },
];

export function getUserByUsername(username: string) {
  return users.find((u) => u.username === username);
}

export function addUser(user: Omit<User, "id">) {
  const userWithId = { ...user, id: v4() };
  users.push(userWithId);
  return userWithId;
}
