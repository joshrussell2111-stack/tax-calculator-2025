// 2025 Tax Brackets
const taxBrackets2025 = {
    single: [
        { rate: 0.10, min: 0, max: 11925 },
        { rate: 0.12, min: 11925, max: 48475 },
        { rate: 0.22, min: 48475, max: 103350 },
        { rate: 0.24, min: 103350, max: 197300 },
        { rate: 0.32, min: 197300, max: 250525 },
        { rate: 0.35, min: 250525, max: 626350 },
        { rate: 0.37, min: 626350, max: Infinity }
    ],
    mfj: [
        { rate: 0.10, min: 0, max: 23850 },
        { rate: 0.12, min: 23850, max: 96950 },
        { rate: 0.22, min: 96950, max: 206700 },
        { rate: 0.24, min: 206700, max: 394600 },
        { rate: 0.32, min: 394600, max: 501050 },
        { rate: 0.35, min: 501050, max: 751600 },
        { rate: 0.37, min: 751600, max: Infinity }
    ],
    mfs: [
        { rate: 0.10, min: 0, max: 11925 },
        { rate: 0.12, min: 11925, max: 48475 },
        { rate: 0.22, min: 48475, max: 103350 },
        { rate: 0.24, min: 103350, max: 197300 },
        { rate: 0.32, min: 197300, max: 250525 },
        { rate: 0.35, min: 250525, max: 375800 },
        { rate: 0.37, min: 375800, max: Infinity }
    ],
    hoh: [
        { rate: 0.10, min: 0, max: 17000 },
        { rate: 0.12, min: 17000, max: 64850 },
        { rate: 0.22, min: 64850, max: 103350 },
        { rate: 0.24, min: 103350, max: 197300 },
        { rate: 0.32, min: 197300, max: 250500 },
        { rate: 0.35, min: 250500, max: 626350 },
        { rate: 0.37, min: 626350, max: Infinity }
    ]
};

// 2025 Standard Deductions
const standardDeductions2025 = {
    single: 15000,
    mfj: 30000,
    mfs: 15000,
    hoh: 22500
};

const additionalDeduction = 2000; // For age 65+

// Long-term capital gains brackets (2025)
const ltcgBrackets2025 = {
    single: [
        { rate: 0.00, min: 0, max: 48350 },
        { rate: 0.15, min: 48350, max: 533400 },
        { rate: 0.20, min: 533400, max: Infinity }
    ],
    mfj: [
        { rate: 0.00, min: 0, max: 96700 },
        { rate: 0.15, min: 96700, max: 600050 },
        { rate: 0.20, min: 600050, max: Infinity }
    ],
    mfs: [
        { rate: 0.00, min: 0, max: 48350 },
        { rate: 0.15, min: 48350, max: 300025 },
        { rate: 0.20, min: 300025, max: Infinity }
    ],
    hoh: [
        { rate: 0.00, min: 0, max: 64750 },
        { rate: 0.15, min: 64750, max: 566700 },
        { rate: 0.20, min: 566700, max: Infinity }
    ]
};

// Bracket colors
const bracketColors = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#f97316', '#ef4444'];

// Global tax calculation result
let taxResult = {};

// Format currency
function formatCurrency(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
}

// Get input value
function getInputValue(id) {
    const value = parseFloat(document.getElementById(id).value) || 0;
    return Math.max(0, value);
}

// Calculate Social Security Taxability
function calculateSSTaxability(ssBenefits, otherIncome, taxExemptInterest, filingStatus) {
    if (ssBenefits === 0) {
        return {
            taxableSS: 0,
            worksheet: {
                totalSS: 0,
                halfSS: 0,
                otherIncome: 0,
                taxExempt: 0,
                combined: 0,
                base: 0,
                excess: 0,
                taxableSS: 0
            }
        };
    }

    const halfSS = ssBenefits / 2;
    const combinedIncome = halfSS + otherIncome + taxExemptInterest;

    // Base amounts
    const baseAmount1 = (filingStatus === 'mfj') ? 32000 : 25000;
    const baseAmount2 = (filingStatus === 'mfj') ? 44000 : 34000;

    let taxableSS = 0;

    if (combinedIncome > baseAmount2) {
        // 85% taxability tier
        const excess2 = combinedIncome - baseAmount2;
        const tier2 = Math.min(excess2 * 0.85, ssBenefits * 0.85);
        
        const excess1 = baseAmount2 - baseAmount1;
        const tier1 = Math.min(excess1 * 0.5, ssBenefits * 0.5);
        
        taxableSS = tier1 + tier2;
    } else if (combinedIncome > baseAmount1) {
        // 50% taxability tier
        const excess1 = combinedIncome - baseAmount1;
        taxableSS = Math.min(excess1 * 0.5, ssBenefits * 0.5);
    }

    taxableSS = Math.min(taxableSS, ssBenefits * 0.85);

    return {
        taxableSS: taxableSS,
        worksheet: {
            totalSS: ssBenefits,
            halfSS: halfSS,
            otherIncome: otherIncome,
            taxExempt: taxExemptInterest,
            combined: combinedIncome,
            base: baseAmount1,
            excess: Math.max(0, combinedIncome - baseAmount1),
            taxableSS: taxableSS
        }
    };
}

// Calculate ordinary income tax
function calculateOrdinaryTax(taxableIncome, filingStatus) {
    const brackets = taxBrackets2025[filingStatus];
    let tax = 0;
    let marginalRate = 0;
    let currentBracketIndex = 0;

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        
        if (taxableIncome > bracket.min) {
            const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
            tax += taxableInBracket * bracket.rate;
            marginalRate = bracket.rate;
            currentBracketIndex = i;
        }
    }

    return { tax, marginalRate, currentBracketIndex };
}

// Calculate capital gains tax
function calculateCapitalGainsTax(qualifiedDivAndGains, ordinaryTaxableIncome, filingStatus) {
    if (qualifiedDivAndGains === 0) return 0;

    const brackets = ltcgBrackets2025[filingStatus];
    let tax = 0;

    // Stack LTCG on top of ordinary income
    const bottomOfLTCG = ordinaryTaxableIncome;
    const topOfLTCG = bottomOfLTCG + qualifiedDivAndGains;

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        
        if (topOfLTCG > bracket.min) {
            const bracketStart = Math.max(bracket.min, bottomOfLTCG);
            const bracketEnd = Math.min(bracket.max, topOfLTCG);
            const amountInBracket = Math.max(0, bracketEnd - bracketStart);
            
            tax += amountInBracket * bracket.rate;
        }
    }

    return tax;
}

// Main tax calculation function
function calculateTax() {
    const filingStatus = document.getElementById('filingStatus').value;
    const age = getInputValue('age');
    
    // Get all income sources
    const wages = getInputValue('wages');
    const ssBenefits = getInputValue('ssBenefits');
    const taxExemptInterest = getInputValue('taxExemptInterest');
    const taxableInterest = getInputValue('taxableInterest');
    const qualifiedDividends = getInputValue('qualifiedDividends');
    const ordinaryDividends = getInputValue('ordinaryDividends');
    const iraDistributions = getInputValue('iraDistributions');
    const pension = getInputValue('pension');
    const rothDistributions = getInputValue('rothDistributions');
    const annuity = getInputValue('annuity');
    const capitalGains = getInputValue('capitalGains');
    const otherIncome = getInputValue('otherIncome');

    // Calculate other income for SS calculation (excludes SS itself)
    const otherIncomeForSS = wages + taxableInterest + (ordinaryDividends - qualifiedDividends) + 
                             iraDistributions + pension + annuity + otherIncome;

    // Calculate SS taxability
    const ssCalc = calculateSSTaxability(ssBenefits, otherIncomeForSS, taxExemptInterest, filingStatus);
    const taxableSS = ssCalc.taxableSS;

    // Calculate AGI
    const agi = wages + taxableSS + taxableInterest + ordinaryDividends + 
                iraDistributions + pension + annuity + capitalGains + otherIncome;

    // Calculate standard deduction
    let standardDeduction = standardDeductions2025[filingStatus];
    if (age >= 65) {
        standardDeduction += additionalDeduction;
    }

    // Calculate taxable income
    const ordinaryTaxableIncome = Math.max(0, agi - standardDeduction - qualifiedDividends - capitalGains);
    const totalTaxableIncome = Math.max(0, agi - standardDeduction);

    // Calculate ordinary income tax
    const ordinaryTaxCalc = calculateOrdinaryTax(ordinaryTaxableIncome, filingStatus);
    const ordinaryTax = ordinaryTaxCalc.tax;

    // Calculate capital gains tax
    const qualifiedDivAndGains = qualifiedDividends + capitalGains;
    const capitalGainsTax = calculateCapitalGainsTax(qualifiedDivAndGains, ordinaryTaxableIncome, filingStatus);

    // Total tax
    const totalTax = ordinaryTax + capitalGainsTax;

    // Total income (including non-taxable)
    const totalIncome = agi + rothDistributions;

    // Effective rate
    const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

    // Store result globally
    taxResult = {
        filingStatus,
        totalIncome,
        agi,
        standardDeduction,
        taxableSS,
        totalTaxableIncome,
        ordinaryTaxableIncome,
        ordinaryTax,
        capitalGainsTax,
        totalTax,
        effectiveRate,
        marginalRate: ordinaryTaxCalc.marginalRate * 100,
        currentBracketIndex: ordinaryTaxCalc.currentBracketIndex,
        ssWorksheet: ssCalc.worksheet
    };

    // Update display
    updateDisplay();
    updateBracketVisualization();
    updateSolver();
}

// Update display elements
function updateDisplay() {
    document.getElementById('totalIncome').textContent = formatCurrency(taxResult.totalIncome);
    document.getElementById('taxableIncome').textContent = formatCurrency(taxResult.totalTaxableIncome);
    document.getElementById('totalTax').textContent = formatCurrency(taxResult.totalTax);
    document.getElementById('effectiveRate').textContent = taxResult.effectiveRate.toFixed(2) + '%';
    
    document.getElementById('agi').textContent = formatCurrency(taxResult.agi);
    document.getElementById('standardDeduction').textContent = formatCurrency(taxResult.standardDeduction);
    document.getElementById('taxableSS').textContent = formatCurrency(taxResult.taxableSS);
    document.getElementById('ordinaryTax').textContent = formatCurrency(taxResult.ordinaryTax);
    document.getElementById('capitalGainsTax').textContent = formatCurrency(taxResult.capitalGainsTax);
    document.getElementById('currentBracket').textContent = (taxResult.marginalRate).toFixed(0) + '%';
    document.getElementById('marginalRate').textContent = (taxResult.marginalRate).toFixed(0) + '%';

    // Update SS worksheet
    const ws = taxResult.ssWorksheet;
    document.getElementById('wsSS').textContent = formatCurrency(ws.totalSS);
    document.getElementById('wsHalfSS').textContent = formatCurrency(ws.halfSS);
    document.getElementById('wsOtherIncome').textContent = formatCurrency(ws.otherIncome);
    document.getElementById('wsTaxExempt').textContent = formatCurrency(ws.taxExempt);
    document.getElementById('wsCombined').textContent = formatCurrency(ws.combined);
    document.getElementById('wsBase').textContent = formatCurrency(ws.base);
    document.getElementById('wsExcess').textContent = formatCurrency(ws.excess);
    document.getElementById('wsTaxableSS').textContent = formatCurrency(ws.taxableSS);
}

// Update bracket visualization
function updateBracketVisualization() {
    const brackets = taxBrackets2025[taxResult.filingStatus];
    const taxableIncome = taxResult.ordinaryTaxableIncome;
    const container = document.getElementById('bracketVisualization');
    
    let html = '';
    
    brackets.forEach((bracket, index) => {
        const isInfinite = bracket.max === Infinity;
        const rangeText = isInfinite 
            ? `${formatCurrency(bracket.min)}+` 
            : `${formatCurrency(bracket.min)} - ${formatCurrency(bracket.max)}`;
        
        const bracketWidth = isInfinite ? bracket.min : (bracket.max - bracket.min);
        const incomeInBracket = Math.max(0, Math.min(taxableIncome, bracket.max) - bracket.min);
        const fillPercent = isInfinite 
            ? (taxableIncome > bracket.min ? 30 : 0)
            : (incomeInBracket / bracketWidth * 100);
        
        const isCurrent = taxableIncome > bracket.min && taxableIncome <= bracket.max;
        const isFuture = taxableIncome <= bracket.min;
        const statusClass = isCurrent ? 'current' : (isFuture ? 'future' : '');
        
        const color = bracketColors[index];
        
        html += `
            <div class="bracket-bar-container ${statusClass}">
                <div class="bracket-header">
                    <div class="bracket-label">
                        <div class="bracket-rate" style="background: ${color};">${(bracket.rate * 100)}%</div>
                        <span>${rangeText}</span>
                    </div>
                </div>
                <div class="bracket-progress-bg">
                    <div class="bracket-progress-fill" style="width: ${fillPercent}%; background: ${color};">
                        ${incomeInBracket > 0 ? `<span class="bracket-amount">${formatCurrency(incomeInBracket)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Update bracket solver
function updateSolver() {
    const targetBracketIndex = parseInt(document.getElementById('targetBracket').value);
    const brackets = taxBrackets2025[taxResult.filingStatus];
    const targetBracket = brackets[targetBracketIndex];
    const nextBracket = brackets[targetBracketIndex + 1];
    
    const currentIncome = taxResult.ordinaryTaxableIncome;
    const roomRemaining = Math.max(0, targetBracket.max - currentIncome);
    
    // Calculate savings
    let savings = 0;
    if (nextBracket && roomRemaining > 0) {
        // If you earn $1 more after maxing this bracket, the difference in tax rate
        const rateDiff = nextBracket.rate - targetBracket.rate;
        // Savings on the room remaining
        savings = roomRemaining * rateDiff;
    }
    
    document.getElementById('solverAmount').textContent = formatCurrency(roomRemaining);
    document.getElementById('solverSavings').textContent = formatCurrency(savings);
}

// Toggle worksheet
function toggleWorksheet() {
    const content = document.getElementById('worksheetContent');
    const arrow = document.getElementById('worksheetArrow');
    
    content.classList.toggle('active');
    
    if (content.classList.contains('active')) {
        arrow.style.transform = 'rotate(180deg)';
    } else {
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    calculateTax();
});
