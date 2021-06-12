export const users = [
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
