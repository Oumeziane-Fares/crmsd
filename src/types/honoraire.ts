export type Honoraire = {
  id: number;
  hcp: string;
  poste: string;
  acte: string;
  bon: string | null;
  activite: 'médicale' | 'paramédicale';
  rdv: string;
  patient: string;
  sponsoring: string;
  ca_total: number;
  ca_acte: number;
  honoraire: number;
  part_sd: number;
  moment: string;
};
