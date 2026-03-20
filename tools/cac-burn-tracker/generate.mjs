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

function round(n, dp = 1) {
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

function sum(obj) {
  return Object.values(obj || {}).reduce((acc, n) => acc + (Number(n) || 0), 0);
}

function compute(input) {
  const months = input.months ?? ['M1', 'M2', 'M3', 'M4'];

  const fixedMonthly = sum(input.fixedAnnualBudgetsNgn) / 12;
  const opsMonthly = sum(input.opsMonthlyBudgetsNgn);
  const marketingMonthly = Number(input.opsMonthlyBudgetsNgn?.marketing || 0);

  let signups = Number(input.month1CustomerSignups || 0);
  let b2bAccounts = Number(input.b2bAccountsMonth1 || 0);

  const rows = [];
  for (let i = 0; i < months.length; i += 1) {
    const funded = signups * Number(input.walletFundedRate || 0);
    const created = funded * Number(input.ordersPerFundedCustomerPerMonth || 0);
    const accepted = created * Number(input.acceptanceRate || 0);
    const customerCompleted = accepted * Number(input.completionRate || 0);

    const b2bCreated = b2bAccounts * Number(input.b2bJobsPerAccountPerMonth || 0);
    const b2bCompleted = b2bCreated * Number(input.b2bCompletionRate || 0);

    const completed = customerCompleted + b2bCompleted;
    const gmv = completed * Number(input.avgServiceFeeNgn || 0);
    const revenue = gmv * Number(input.takeRateTotal || 0);

    const grossBurn = fixedMonthly + opsMonthly;
    const netBurn = grossBurn - revenue;

    const cacSignup = signups > 0 ? marketingMonthly / signups : '';
    const cacFunded = funded > 0 ? marketingMonthly / funded : '';
    const cacFirstCompleted = completed > 0 ? marketingMonthly / completed : '';
    const paybackMonths = funded > 0 && revenue > 0 ? (marketingMonthly / funded) / (revenue / funded) : '';

    rows.push({
      month: months[i],
      signups: round(signups, 1),
      funded: round(funded, 1),
      created: round(created, 1),
      accepted: round(accepted, 1),
      customerCompleted: round(customerCompleted, 1),
      b2bAccounts,
      b2bCreated: round(b2bCreated, 1),
      b2bCompleted: round(b2bCompleted, 1),
      completed: round(completed, 1),
      gmv: Math.round(gmv),
      revenue: Math.round(revenue),
      fixedBurn: Math.round(fixedMonthly),
      opsBurn: Math.round(opsMonthly),
      grossBurn: Math.round(grossBurn),
      netBurn: Math.round(netBurn),
      cacSignup: cacSignup === '' ? '' : Math.round(cacSignup),
      cacFunded: cacFunded === '' ? '' : Math.round(cacFunded),
      cacFirstCompleted: cacFirstCompleted === '' ? '' : Math.round(cacFirstCompleted),
      paybackMonths: paybackMonths === '' ? '' : round(paybackMonths, 2),
    });

    signups *= 1 + Number(input.signupMoMGrowthRate || 0);
    b2bAccounts += Number(input.b2bAccountsAddedPerMonth || 0);
  }

  const avgNetBurn = rows.length ? rows.reduce((acc, r) => acc + (Number(r.netBurn) || 0), 0) / rows.length : 0;
  const runway =
    Number(input.startingCashNgn || 0) > 0 && avgNetBurn > 0 ? Number(input.startingCashNgn) / avgNetBurn : '';

  return { rows, fixedMonthly, opsMonthly, marketingMonthly, avgNetBurn, runway };
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

  const { rows, fixedMonthly, opsMonthly, marketingMonthly, avgNetBurn, runway } = compute(input);

  const lines = [];
  lines.push(toCsvRow(['Handyman CAC + Burn Tracker (automated output)']));
  lines.push('');
  lines.push(toCsvRow(['FixedMonthlyBurn', Math.round(fixedMonthly)]));
  lines.push(toCsvRow(['OpsMonthlyBurn', Math.round(opsMonthly)]));
  lines.push(toCsvRow(['MarketingMonthlySpend', Math.round(marketingMonthly)]));
  lines.push(toCsvRow(['AvgNetBurnMonthly', Math.round(avgNetBurn)]));
  lines.push(toCsvRow(['EstimatedRunwayMonths', runway === '' ? '' : round(runway, 2)]));
  lines.push('');

  lines.push(
    toCsvRow([
      'Month',
      'Customer signups',
      'Funded customers',
      'Customer orders created',
      'Customer accepted',
      'Customer completed',
      'B2B accounts',
      'B2B created',
      'B2B completed',
      'Total completed',
      'GMV (NGN)',
      'Platform revenue (NGN)',
      'Fixed burn (NGN)',
      'Ops burn (NGN)',
      'Gross burn (NGN)',
      'Net burn (NGN)',
      'CAC/signup (NGN)',
      'CAC/funded (NGN)',
      'CAC/first completed (NGN)',
      'Payback months (CAC funded)'
    ])
  );

  for (const r of rows) {
    lines.push(
      toCsvRow([
        r.month,
        r.signups,
        r.funded,
        r.created,
        r.accepted,
        r.customerCompleted,
        r.b2bAccounts,
        r.b2bCreated,
        r.b2bCompleted,
        r.completed,
        r.gmv,
        r.revenue,
        r.fixedBurn,
        r.opsBurn,
        r.grossBurn,
        r.netBurn,
        r.cacSignup,
        r.cacFunded,
        r.cacFirstCompleted,
        r.paybackMonths
      ])
    );
  }

  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  fs.writeFileSync(absOut, lines.join('\n'), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath}`);
}

main();

