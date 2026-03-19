import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (!key?.startsWith('--')) continue;
    if (!next || next.startsWith('--')) {
      args[key.slice(2)] = true;
      continue;
    }
    args[key.slice(2)] = next;
    i += 1;
  }
  return args;
}

function round(n, dp = 0) {
  const m = 10 ** dp;
  return Math.round((Number(n) + Number.EPSILON) * m) / m;
}

function toCsvRow(values) {
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replaceAll('"', '""')}"`;
      return s;
    })
    .join(',');
}

function computeProjection(input) {
  const months = input.months ?? ['M1', 'M2', 'M3', 'M4'];
  const rows = [];

  let signups = input.month1CustomerSignups;
  let b2bAccounts = input.b2bAccountsMonth1;
  let cumOnboarded = 0;

  for (let idx = 0; idx < months.length; idx += 1) {
    const monthLabel = months[idx];

    const walletFunded = signups * input.walletFundedRate;
    const customerOrdersCreated = walletFunded * input.ordersPerFundedCustomerPerMonth;
    const customerAccepted = customerOrdersCreated * input.acceptanceRate;
    const customerCompleted = customerAccepted * input.completionRate;

    const b2bCreated = b2bAccounts * input.b2bJobsPerAccountPerMonth;
    const b2bCompleted = b2bCreated * input.b2bCompletionRate;

    const totalDemandCompleted = customerCompleted + b2bCompleted;

    const newHandymen = input.handymenOnboardedPerWeek * input.weeksPerMonth;
    cumOnboarded += newHandymen;

    const activeHandymen = cumOnboarded * input.verifiedRateHandymen * input.activeRateVerifiedHandymen;
    const supplyCapacityCompleted =
      activeHandymen * input.jobsPerActiveHandymanPerWeek * input.weeksPerMonth;

    const finalCompleted = Math.min(totalDemandCompleted, supplyCapacityCompleted);
    const gmvNgn = finalCompleted * input.avgServiceFeeNgn;
    const platformRevenueNgn = gmvNgn * input.takeRateTotal;
    const netAfterGrowthSpendNgn = platformRevenueNgn - input.monthlyGrowthSpendNgn;

    rows.push({
      month: monthLabel,
      customerSignups: round(signups, 1),
      walletFundedCustomers: round(walletFunded, 1),
      customerOrdersCreated: round(customerOrdersCreated, 1),
      customerAccepted: round(customerAccepted, 1),
      customerCompleted: round(customerCompleted, 1),
      b2bAccounts,
      b2bCreated: round(b2bCreated, 1),
      b2bCompleted: round(b2bCompleted, 1),
      totalDemandCompleted: round(totalDemandCompleted, 1),
      newHandymen: round(newHandymen, 1),
      cumulativeOnboarded: round(cumOnboarded, 1),
      activeHandymen: round(activeHandymen, 1),
      supplyCapacityCompleted: round(supplyCapacityCompleted, 1),
      finalCompleted: round(finalCompleted, 1),
      gmvNgn: Math.round(gmvNgn),
      platformRevenueNgn: Math.round(platformRevenueNgn),
      netAfterGrowthSpendNgn: Math.round(netAfterGrowthSpendNgn)
    });

    signups *= 1 + input.signupMoMGrowthRate;
    b2bAccounts += input.b2bAccountsAddedPerMonth;
  }

  return rows;
}

function main() {
  const args = parseArgs(process.argv);
  const inPath = args.in;
  const outPath = args.out;
  if (!inPath || !outPath) {
    // eslint-disable-next-line no-console
    console.error('Usage: node generate.mjs --in <inputs.json> --out <output.csv>');
    process.exit(2);
  }

  const absIn = path.resolve(process.cwd(), inPath);
  const absOut = path.resolve(process.cwd(), outPath);
  const input = JSON.parse(fs.readFileSync(absIn, 'utf8'));

  const projection = computeProjection(input);

  const lines = [];
  lines.push(toCsvRow(['Handyman Engagement + Revenue Tracker (automated output)']));
  lines.push('');
  lines.push(
    toCsvRow([
      'Month',
      'Customer signups',
      'Wallet funded customers',
      'Customer orders created',
      'Customer accepted',
      'Customer completed',
      'B2B accounts',
      'B2B created',
      'B2B completed',
      'Total demand completed',
      'New handymen',
      'Cum. onboarded',
      'Active handymen',
      'Supply capacity completed',
      'Final completed (min)',
      'GMV (NGN)',
      'Platform revenue (NGN)',
      'Net after growth spend (NGN)'
    ])
  );

  for (const r of projection) {
    lines.push(
      toCsvRow([
        r.month,
        r.customerSignups,
        r.walletFundedCustomers,
        r.customerOrdersCreated,
        r.customerAccepted,
        r.customerCompleted,
        r.b2bAccounts,
        r.b2bCreated,
        r.b2bCompleted,
        r.totalDemandCompleted,
        r.newHandymen,
        r.cumulativeOnboarded,
        r.activeHandymen,
        r.supplyCapacityCompleted,
        r.finalCompleted,
        r.gmvNgn,
        r.platformRevenueNgn,
        r.netAfterGrowthSpendNgn
      ])
    );
  }

  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  fs.writeFileSync(absOut, lines.join('\n'), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath}`);
}

main();
