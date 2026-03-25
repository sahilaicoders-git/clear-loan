export interface LoanInputs {
  principal: number;
  annualInterestRate: number;
  tenureYears: number;
  monthlyPrepayment: number;
  startDate: string; // YYYY-MM-DD
  category: string;
  calcMethod: 'standard' | 'mudra';
  oneTimePrepayments?: Record<number, number>;
}

export interface AmortizationRow {
  month: number;
  date: Date;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  prepayment: number;
  balance: number;
}

export interface LoanResults {
  monthlyEmi: number;
  isMudra: boolean;
  totalInterestStandard: number;
  totalPaymentStandard: number;
  totalInterestWithPrepayment: number;
  totalPaymentWithPrepayment: number;
  interestSaved: number;
  monthsSaved: number;
  standardAmortization: AmortizationRow[];
  prepaymentAmortization: AmortizationRow[];
}

export function calculateLoan(inputs: LoanInputs): LoanResults {
  const { principal, annualInterestRate, tenureYears, monthlyPrepayment, startDate, calcMethod } = inputs;
  
  const isMudra = calcMethod === 'mudra';
  const r = annualInterestRate / 12 / 100;
  const n = tenureYears * 12;

  // Track root date
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);

  // Calculate Base Parameters
  let emi: number;
  let fixedPrincipal = 0;

  if (isMudra) {
    fixedPrincipal = principal / n;
    emi = fixedPrincipal + (principal * r); // First month payment
  } else {
    if (r === 0) {
      emi = principal / n;
    } else {
      emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
  }

  // --- Calculate Standard Amortization ---
  let currentBalance = principal;
  let totalInterestStandard = 0;
  const standardAmortization: AmortizationRow[] = [];

  for (let i = 1; i <= n; i++) {
    const interest = currentBalance * r;
    let principalPaid = isMudra ? fixedPrincipal : (emi - interest);

    if (currentBalance - principalPaid <= 0) {
      principalPaid = currentBalance;
      currentBalance = 0;
    } else {
      currentBalance -= principalPaid;
    }

    totalInterestStandard += interest;
    let currentPayment = principalPaid + interest;

    standardAmortization.push({
      month: i,
      date: new Date(startYear, startMonth - 1 + i, startDay || 1),
      emi: isMudra ? currentPayment : emi,
      principalPaid,
      interestPaid: interest,
      prepayment: 0,
      balance: currentBalance,
    });

    if (currentBalance <= 0) break;
  }

  // --- Calculate Prepayment Amortization ---
  currentBalance = principal;
  let totalInterestWithPrepayment = 0;
  let monthsTaken = 0;
  const prepaymentAmortization: AmortizationRow[] = [];

  // Loop until balance is fully paid, might exceed `n` if there are underpayments?
  // But standard is EMI, overpayments will make it less than `n`.
  for (let i = 1; i <= n; i++) {
    const interest = currentBalance * r;
    let principalPaid = isMudra ? fixedPrincipal : (emi - interest);

    // Handle last month exactly
    let actualPrepayment = monthlyPrepayment + (inputs.oneTimePrepayments?.[i] || 0);

    if (currentBalance < principalPaid + actualPrepayment) {
      // Balance is less than Principal + Prepayment
      if (currentBalance < principalPaid) {
        principalPaid = currentBalance;
        actualPrepayment = 0;
      } else {
        actualPrepayment = currentBalance - principalPaid;
      }
    }

    currentBalance -= (principalPaid + actualPrepayment);
    totalInterestWithPrepayment += interest;
    monthsTaken = i;

    let currentPayment = principalPaid + interest;

    prepaymentAmortization.push({
      month: i,
      date: new Date(startYear, startMonth - 1 + i, startDay || 1),
      emi: isMudra ? currentPayment : emi,
      principalPaid,
      interestPaid: interest,
      prepayment: actualPrepayment,
      balance: Math.max(0, currentBalance),
    });

    if (currentBalance <= 0) break;
  }

  const interestSaved = totalInterestStandard - totalInterestWithPrepayment;
  const monthsSaved = n - monthsTaken;

  return {
    monthlyEmi: emi,
    isMudra,
    totalInterestStandard,
    totalPaymentStandard: principal + totalInterestStandard,
    totalInterestWithPrepayment,
    totalPaymentWithPrepayment: principal + totalInterestWithPrepayment,
    interestSaved,
    monthsSaved,
    standardAmortization,
    prepaymentAmortization,
  };
}
