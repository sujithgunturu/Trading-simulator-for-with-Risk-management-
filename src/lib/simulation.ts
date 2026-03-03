export interface SimulationParams {
  initialBalance: number;
  riskPercent: number;
  winRate: number;
  riskRewardRatio: number;
  numTrades: number;
}

export interface SimulationResult {
  trade: number;
  balance: number;
  expected: number;
}

export function runSimulation({
  initialBalance,
  riskPercent,
  winRate,
  riskRewardRatio,
  numTrades,
}: SimulationParams): SimulationResult[] {
  const results: SimulationResult[] = [];
  let currentBalance = initialBalance;
  let expectedBalance = initialBalance;

  // Initial point (Trade 0)
  results.push({
    trade: 0,
    balance: initialBalance,
    expected: initialBalance,
  });

  for (let i = 1; i <= numTrades; i++) {
    // 1. Calculate Expected Value (Deterministic)
    // Expected Return per trade = (Win% * WinAmount) - (Loss% * LossAmount)
    // WinAmount = RiskAmount * RewardRatio
    // LossAmount = RiskAmount
    // RiskAmount = ExpectedBalance * (riskPercent / 100)
    
    // E(R) multiplier = (WinRate * RewardRatio * Risk%) - ((1-WinRate) * Risk%)
    // But wait, compounding works differently.
    // Expected Multiplier per trade = (Win% * (1 + Reward*Risk%)) + (Loss% * (1 - Risk%))
    // Let's derive it:
    // If Win: NewBal = OldBal * (1 + (Risk% * Reward))
    // If Loss: NewBal = OldBal * (1 - Risk%)
    // Expected Multiplier = (WinRate * (1 + Risk% * Reward)) + ((1 - WinRate) * (1 - Risk%))
    
    const riskDecimal = riskPercent / 100;
    const winRateDecimal = winRate / 100;
    
    const winMultiplier = 1 + (riskDecimal * riskRewardRatio);
    const lossMultiplier = 1 - riskDecimal;
    
    const expectedMultiplier = (winRateDecimal * winMultiplier) + ((1 - winRateDecimal) * lossMultiplier);
    expectedBalance = expectedBalance * expectedMultiplier;

    // 2. Calculate Simulated Value (Stochastic)
    const isWin = Math.random() < winRateDecimal;
    if (isWin) {
      currentBalance = currentBalance * winMultiplier;
    } else {
      currentBalance = currentBalance * lossMultiplier;
    }

    // Prevent negative balance in simulation (bankruptcy)
    if (currentBalance < 0) currentBalance = 0;

    results.push({
      trade: i,
      balance: currentBalance,
      expected: expectedBalance,
    });
  }

  return results;
}
