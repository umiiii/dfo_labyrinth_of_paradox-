export const FLOOR_ROUTES: Record<string, string> = {
  '1/1': 'lab1_f1_11221',
  '1/2': 'lab1_f1_12321',
  '1/3': 'lab1_f1_13322',
  '1/4': 'lab1_f1_22113',
  '1/5': 'lab1_f1_23132',
  '2/1': 'lab1_f2_12322',
  '2/2': 'lab1_f2_22222',
  '2/3': 'lab1_f2_22232',
  '2/4': 'lab1_f2_31222',
  '2/5': 'lab1_f2_32122',
  '3/1': 'lab1_f3_11222',
  '3/2': 'lab1_f3_12322',
  '3/3': 'lab1_f3_21211',
  '3/4': 'lab1_f3_21223',
  '3/5': 'lab1_f3_22221',
  '4/1': 'lab1_f4_route1',
  '4/2': 'lab1_f4_route2',
  '4/3': 'lab1_f4_route3',
  '4/4': 'lab1_f4_route4',
  '4/5': 'lab1_f4_route5',
  '5/1': 'lab1_f5_12222',
  '5/2': 'lab1_f5_21222',
  '5/3': 'lab1_f5_21232',
  '5/4': 'lab1_f5_22312',
  '5/5': 'lab1_f5_33122',
  '6/1': 'lab1_f6_21222_a',
  '6/2': 'lab1_f6_21222_b',
  '6/3': 'lab1_f6_22211',
  '6/4': 'lab1_f6_22212',
  '6/5': 'lab1_f6_32212',
};

export function floorUrl(floorId: string): string | null {
  for (const [route, id] of Object.entries(FLOOR_ROUTES)) {
    if (id === floorId) return `/labyrinth/${route}`;
  }
  return null;
}
