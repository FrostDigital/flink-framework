interface User {
    id: string;
    role: "user" | "admin" | "teamleader";
    name: string;
    email: string;
    tel: string;
}

export default User;