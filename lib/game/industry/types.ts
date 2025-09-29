export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  services: string[]; // references to service IDs
}