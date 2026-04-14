export function createInviteToken(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return `${part()}${part()}`;
}
