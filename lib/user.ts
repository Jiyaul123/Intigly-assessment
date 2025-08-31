const BASE_USERS = 'https://jsonplaceholder.typicode.com/users';

export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
};

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(BASE_USERS);
  if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
  return res.json();
}

export async function fetchUserById(id: number): Promise<User> {
  const res = await fetch(`${BASE_USERS}/${id}`);
  if (!res.ok) throw new Error(`User not found`);
  return res.json();
}
