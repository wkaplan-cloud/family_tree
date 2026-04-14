export type GraphPerson = {
  id: string;
  name: string;
  alive: boolean;
  email?: string | null;
  notes?: string | null;
  consentStatus?: string | null;
};

export type GraphRelationship = {
  id: string;
  leftId: string;
  rightId: string;
  label: string;
};
