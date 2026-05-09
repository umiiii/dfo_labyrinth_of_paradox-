export interface FloorNode {
  row: number;
  col: number;
  icon_id: string;
  tier?: string;
}

export interface FloorEdge {
  from: [number, number];
  to: [number, number];
}

export interface Floor {
  schema_version: 1;
  floor_id: string;
  name: string;
  grid: { cols: number; rows: number };
  nodes: FloorNode[];
  edges: FloorEdge[];
}

export interface RewardItem {
  image: string;
  count?: number;
  label?: string;
}

export interface IconDef {
  id: string;
  name: string;
  description: string;
  icon: Record<string, string>;
  rewards?: RewardItem[];
}

export type IconDict = Record<string, IconDef>;

export type NodeKey = `${number}_${number}`;

export interface DerivedEdge {
  from: NodeKey;
  to: NodeKey;
}

export interface ResolvedIcon {
  fixed: string;
  hover: string;
}
