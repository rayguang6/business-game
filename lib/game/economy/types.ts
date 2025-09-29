export interface EconomyState {
  money: number;
  score: number;
}

export interface EconomyActions {
  updateMoney: (amount: number) => void;
  updateScore: (points: number) => void;
  addRevenue: (amount: number) => void;
  addScore: (points: number) => void;
}
