// Tax Calculator JavaScript
// 2025 Federal Tax Brackets and Calculations

// 2025 Tax Brackets (Single)
const TAX_BRACKETS_2025 = {
    single: [
        { rate: 0.10, min: 0, max: 11924.99 },
        { rate: 0.12, min: 11925, max: 48474.99 },
        { rate: 0.22, min: 48475, max: 103349.99 },
        { rate: 0.24, min: 103350, max: 197299.99 },
        { rate: 0.32, min: 197300, max: 250524.99 },
        { rate: 0.35, min: 250525, max: 626349.99 },
        { rate: 0.37, min: 626350, max: Infinity }
    ],
    married_joint: [
        { rate: 0.10, min: 0, max: 23849.99 },
        { rate: 0.12, min: 23850, max: 96949.99 },
        { rate: 0.22, min: 96950, max: 206699.99 },
        { rate: 0.24, min: 206700, max: 394599.99 },
        { rate: 0.32, min: 394600, max: 501049.99 },
        { rate: 0.35, min: 501050, max: 751599.99 },
        { rate: 0.37, min: 751600, max: Infinity }
    ],
    married_separate: [
        { rate: 0.10, min: 0, max: 11924.99 },
        { rate: 0.12, min: 11925, max: 48474.99 },
        { rate: 0.22, min: 48475, max: 103349.99 },
        { rate: 0.24, min: 103350, max: 197299.99 },
        { rate: 0.32, min: 197300, max: 250524.99 },
        { rate: 0.35, min: 250525, max: 375799.99 },
        { rate: 0.37, min: 375800, max: Infinity }
    ],
    head_household: [
        { rate: 0.10, min: 0, max: 17099.99 },
        { rate: 0.12, min: 17100, max: 65549.99 },
        { rate: 0.22, min: 65550, max: 100499.99 },
        { rate: 0.24, min: 100500, max: 191949.99 },
        { rate: 0.32, min: 191950, max: 243724.99 },
        { rate: 0.35, min: 243725, max: 609349.99 },
        { rate: 0.37, min: 609350, max: Infinity }
    ]
};

// 2025 Standard Deductions
const STANDARD_DEDUCTIONS_2025 = {
    single: 15000,
    married_joint: 30000,
    married_separate: 15000,
    head_household: 22500
};

// Additional deduction for blind or 65+
const ADDITIONAL_DEDUCTION_2025 = {
    single: 2000,
    married_joint: 3200,
    married_separate: 1600,
    head_household: 2000
};

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format percentage
function formatPercent(value) {
    return (value * 100).toFixed(1) + '%';
}

// Calculate tax based on income and filing status
function calculateTax(income, filingStatus) {
    const brackets = TAX_BRACKETS_2025[filingStatus];
    let totalTax = 0;
    let remainingIncome = income;
    const bracketBreakdown = [];
    
    let marginalRate = 0;
    
    for (const bracket of brackets) {
        const bracketSize = bracket.max === Infinity ? Infinity : bracket.max - bracket.min + 0.01;
        const amountInBracket = Math.min(remainingIncome, bracketSize);
        
        if (amountInBracket > 0) {
            const taxInBracket = amountInBracket * bracket.rate;
            totalTax += taxInBracket;
            remainingIncome -= amountInBracket;
            
            bracketBreakdown.push({
                rate: bracket.rate,
                min: bracket.min,
                max: bracket.max === Infinity ? '∞' : bracket.max,
                amountInBracket: amountInBracket,
                taxInBracket: taxInBracket
            });
            
            marginalRate = bracket.rate;
        }
        
        if (remainingIncome <= 0) break;
    }
    
    return {
        totalTax: totalTax,
        effectiveRate: income > 0 ? totalTax / income : 0,
        marginalRate: marginalRate,
        bracketBreakdown: bracketBreakdown
    };
}

// Find current bracket and room remaining
function findBracketInfo(income, filingStatus) {
    const brackets = TAX_BRACKETS_2025[filingStatus];
    
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        if (income >= bracket.min && income <= bracket.max) {
            const roomRemaining = bracket.max === Infinity ? 0 : bracket.max - income;
            const percentThroughBracket = bracket.max === Infinity ? 100 : 
                ((income - bracket.min) / (bracket.max - bracket.min)) * 100;
            
            return {
                bracket: bracket,
                rate: bracket.rate,
                roomRemaining: roomRemaining,
                percentThroughBracket: Math.min(percentThroughBracket, 100),
                isTopBracket: bracket.max === Infinity
            };
        }
    }
    
    return null;
}

// Calculate Roth conversion room
function calculateRothRoom(income, filingStatus) {
    const bracketInfo = findBracketInfo(income, filingStatus);
    if (!bracketInfo || bracketInfo.isTopBracket) {
        return { room: 0, savings: 0, nextBracketRate: 0 };
    }
    
    const brackets = TAX_BRACKETS_2025[filingStatus];
    const currentBracketIndex = brackets.findIndex(b => b.rate === bracketInfo.rate);
    const nextBracket = brackets[currentBracketIndex + 1];
    
    if (!nextBracket) {
        return { room: 0, savings: 0, nextBracketRate: 0 };
    }
    
    const room = bracketInfo.roomRemaining;
    const savings = room * (nextBracket.rate - bracketInfo.rate);
    
    return {
        room: room,
        savings: savings,
        nextBracketRate: nextBracket.rate
    };
}

// Main calculation function
function performCalculation() {
    // Get input values
    const filingStatus = document.getElementById('filingStatus').value;
    const isBlindOr65 = document.getElementById('isBlindOr65').checked;
    
    const wages = parseFloat(document.getElementById('wages').value) || 0;
    const taxableInterest = parseFloat(document.getElementById('taxableInterest').value) || 0;
    const dividends = parseFloat(document.getElementById('dividends').value) || 0;
    const iraDistributions = parseFloat(document.getElementById('iraDistributions').value) || 0;
    const pension = parseFloat(document.getElementById('pension').value) || 0;
    const rothConversion = parseFloat(document.getElementById('rothConversion').value) || 0;
    const annuity = parseFloat(document.getElementById('annuity').value) || 0;
    const otherIncome = parseFloat(document.getElementById('otherIncome').value) || 0;
    
    // Calculate gross income
    const grossIncome = wages + taxableInterest + dividends + iraDistributions + 
                       pension + rothConversion + annuity + otherIncome;
    
    // Calculate standard deduction
    let standardDeduction = STANDARD_DEDUCTIONS_2025[filingStatus];
    if (isBlindOr65) {
        standardDeduction += ADDITIONAL_DEDUCTION_2025[filingStatus];
    }
    
    // Calculate taxable income
    const taxableIncome = Math.max(0, grossIncome - standardDeduction);
    
    // Calculate tax
    const taxResult = calculateTax(taxableIncome, filingStatus);
    
    // Get bracket info
    const bracketInfo = findBracketInfo(taxableIncome, filingStatus);
    
    // Calculate Roth conversion room
    const rothRoom = calculateRothRoom(taxableIncome, filingStatus);
    
    // Update display
    updateDisplay({
        grossIncome,
        standardDeduction,
        taxableIncome,
        taxResult,
        bracketInfo,
        rothRoom
    });
    
    // Show results section
    document.getElementById('resultsSection').style.display = 'block';
    
    // Update simulation slider max
    const slider = document.getElementById('rothSlider');
    slider.max = rothRoom.room > 0 ? rothRoom.room : 100000;
    slider.value = 0;
    document.getElementById('sliderValue').textContent = formatCurrency(0);
    document.getElementById('simulationResults').style.display = 'none';
}

// Update display with results
function updateDisplay(data) {
    const { grossIncome, standardDeduction, taxableIncome, taxResult, bracketInfo, rothRoom } = data;
    
    // Summary cards
    document.getElementById('grossIncomeDisplay').textContent = formatCurrency(grossIncome);
    document.getElementById('deductionDisplay').textContent = formatCurrency(standardDeduction);
    document.getElementById('taxableIncomeDisplay').textContent = formatCurrency(taxableIncome);
    document.getElementById('taxLiabilityDisplay').textContent = formatCurrency(taxResult.totalTax);
    document.getElementById('effectiveRateDisplay').textContent = formatPercent(taxResult.effectiveRate);
    document.getElementById('marginalRateDisplay').textContent = formatPercent(taxResult.marginalRate);
    
    // Bracket visualization
    if (bracketInfo) {
        document.getElementById('bracketStart').textContent = formatCurrency(bracketInfo.bracket.min);
        document.getElementById('currentPosition').textContent = `Current: ${formatCurrency(taxableIncome)}`;
        document.getElementById('bracketEnd').textContent = bracketInfo.bracket.max === Infinity ? 
            '∞' : formatCurrency(bracketInfo.bracket.max);
        document.getElementById('bracketProgress').style.width = `${bracketInfo.percentThroughBracket}%`;
        document.getElementById('currentBracketRate').textContent = 
            `${formatPercent(bracketInfo.rate)} Bracket`;
        document.getElementById('roomRemaining').textContent = bracketInfo.isTopBracket ? 
            'Top bracket - no ceiling' : `Room remaining: ${formatCurrency(bracketInfo.roomRemaining)}`;
    }
    
    // Roth optimizer
    document.getElementById('rothRoom').textContent = formatCurrency(rothRoom.room);
    document.getElementById('bracketSavings').textContent = formatCurrency(rothRoom.savings);
    
    // Bracket table
    const tbody = document.getElementById('bracketTableBody');
    tbody.innerHTML = '';
    
    taxResult.bracketBreakdown.forEach((bracket, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatPercent(bracket.rate)}</td>
            <td>${formatCurrency(bracket.min)} - ${bracket.max === '∞' ? '∞' : formatCurrency(bracket.max)}</td>
            <td>${formatCurrency(bracket.amountInBracket)}</td>
            <td>${formatCurrency(bracket.taxInBracket)}</td>
        `;
        if (index === taxResult.bracketBreakdown.length - 1) {
            row.style.backgroundColor = '#dbeafe';
            row.style.fontWeight = '600';
        }
        tbody.appendChild(row);
    });
    
    document.getElementById('totalTaxCell').innerHTML = `<strong>${formatCurrency(taxResult.totalTax)}</strong>`;
}

// Simulate additional Roth conversion
function simulateRothConversion() {
    const additionalConversion = parseInt(document.getElementById('rothSlider').value);
    document.getElementById('sliderValue').textContent = formatCurrency(additionalConversion);
    
    if (additionalConversion === 0) {
        document.getElementById('simulationResults').style.display = 'none';
        return;
    }
    
    // Get current values
    const filingStatus = document.getElementById('filingStatus').value;
    const taxableIncome = parseFloat(document.getElementById('taxableIncomeDisplay').textContent.replace(/[^0-9.-]+/g, ''));
    const currentTax = parseFloat(document.getElementById('taxLiabilityDisplay').textContent.replace(/[^0-9.-]+/g, ''));
    
    // Calculate new values
    const newTaxableIncome = taxableIncome + additionalConversion;
    const newTaxResult = calculateTax(newTaxableIncome, filingStatus);
    const additionalTax = newTaxResult.totalTax - currentTax;
    
    // Update simulation display
    document.getElementById('simTaxableIncome').textContent = formatCurrency(newTaxableIncome);
    document.getElementById('simTaxLiability').textContent = formatCurrency(newTaxResult.totalTax);
    document.getElementById('simAdditionalTax').textContent = formatCurrency(additionalTax);
    document.getElementById('simMarginalRate').textContent = formatPercent(newTaxResult.marginalRate);
    
    document.getElementById('simulationResults').style.display = 'block';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', performCalculation);
    
    // Roth slider
    document.getElementById('rothSlider').addEventListener('input', simulateRothConversion);
    
    // Allow Enter key to calculate
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performCalculation();
            }
        });
    });
});
