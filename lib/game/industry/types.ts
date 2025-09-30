export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  image?: string; // Optional image path for industry cards
  color: string;
  services: string[]; // references to service IDs
}