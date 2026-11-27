import { initialTransactions, categories, budgets, accounts } from './data.js';
import { money, escapeHtml, monthLabel, sparkline, categoryChart, drawCharts } from './charts.js';

const STORE = 'commonplace-budget-v1';
const app = document.querySelector('#app');
const dialog = document.querySelector('#entry-dialog');
let state = loadState();
let accountList = JSON.parse(localStorage.getItem('commonplace-accounts') || 'null') || accounts.map((account) => ({ ...account }));
let activePage = location.hash.slice(1) || 'overview';
let period = new Date();
let filter = 'all';
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved && Array.isArray(saved.transactions) && Array.isArray(saved.budgets)) return saved;
  } catch { /* A damaged local copy starts from the included sample ledger. */ }
  return { transactions: initialTransactions.map((item) => ({ ...item })), budgets: budgets.map((item) => ({ ...item })) };
}

function persist() {
  localStorage.setItem(STORE, JSON.stringify(state));
  document.querySelector('.sync-dot')?.classList.add('synced');
}

function inMonth(date, offset = 0) {
  const target = new Date(period.getFullYear(), period.getMonth() + offset, 1);
  const value = new Date(`${date}T12:00:00`);
  return value.getFullYear() === target.getFullYear() && value.getMonth() === target.getMonth();
}

function totals(offset = 0) {
  return state.transactions.filter((item) => inMonth(item.date, offset)).reduce((sum, item) => {
    sum[item.type] += Number(item.amount);
    return sum;
  }, { income: 0, expense: 0 });
}

function balanceNow() {
  return 9296.8 + state.transactions.reduce((sum, item) => sum + (item.type === 'income' ? 1 : -1) * Number(item.amount), 0);
}

function monthTransactions(offset = 0) {
  return state.transactions.filter((item) => inMonth(item.date, offset)).sort((a, b) => b.date.localeCompare(a.date));
}

function changeMonth(step) {
  period = new Date(period.getFullYear(), period.getMonth() + step, 1);
  render();
}

function monthControl() {
  return `<div class="month-control"><button data-action="prev-month" aria-label="Previous month">‹</button><span>${monthLabel(period)}</span><button data-action="next-month" aria-label="Next month">›</button></div>`;
}

function header(title, subtitle, action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">HOUSEHOLD OVERVIEW</p><h1>${title}</h1><p class="subhead">${subtitle}</p></div><div class="heading-actions">${action}</div></div>`;
}

function transactionRows(items, limit = items.length) {
  if (!items.length) return `<div class="empty-state"><span>◌</span><b>No transactions in this view</b><p>Add a transaction to start tracking your household's cash flow.</p><button class="button primary" data-action="add">Add transaction</button></div>`;
  return items.slice(0, limit).map((item) => {
    const cat = categories.find((entry) => entry.name === item.category) || categories.at(-1);
    return `<button class="transaction-row" data-action="edit" data-id="${item.id}"><span class="category-icon ${cat.tone}">${cat.icon}</span><span class="transaction-main"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.category)} <i>·</i> ${escapeHtml(item.account)}</small></span><span class="transaction-date">${new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><strong class="amount ${item.type}">${item.type === 'income' ? '+' : '−'}${money(item.amount)}</strong><span class="row-chevron">›</span></button>`;
  }).join('');
}

function overview() {
  const current = totals();
  const previous = totals(-1);
  const saved = current.income - current.expense;
  const rate = current.income ? Math.round(saved / current.income * 100) : 0;
  const delta = previous.expense ? Math.round((current.expense - previous.expense) / previous.expense * 100) : 0;
  const recent = monthTransactions();
  return `${header('Your money, in view.', 'A clear picture of the household plan and where this month is going.', `<button class="button quiet import-action" data-action="import">↥ <span>Import</span></button><button class="button quiet" data-action="export">↓ <span>Export</span></button><button class="button primary" data-action="add">＋ <span>Add transaction</span></button>`)}
    <div class="overview-toolbar">${monthControl()}<span class="period-note"><span class="live-dot"></span> Updated just now</span></div>
    <section class="metric-grid" aria-label="Monthly summary">
      <article class="metric-card balance-card"><div class="metric-top"><span>Available balance</span><span class="metric-icon">◈</span></div><strong>${money(balanceNow())}</strong><p><span class="positive-chip">${money(current.income - current.expense)}</span> net cash flow this month</p><div class="balance-spark">${sparkline([42,48,44,57,53,61,58,67,64,74,70,83])}</div></article>
      <article class="metric-card"><div class="metric-top"><span>Income</span><span class="metric-icon green">↙</span></div><strong>${money(current.income)}</strong><p><span class="positive-text">${previous.income ? `${current.income === previous.income ? '↔' : current.income > previous.income ? '↑' : '↓'} ${Math.abs(Math.round((current.income - previous.income) / previous.income * 100))}%` : 'New'}</span> from last month</p><canvas class="mini-chart" data-values="45,60,54,76,64,88,73,100" data-tone="green" aria-label="Income trend bars"></canvas></article>
      <article class="metric-card"><div class="metric-top"><span>Spending</span><span class="metric-icon coral">↗</span></div><strong>${money(current.expense)}</strong><p><span class="${delta <= 0 ? 'positive-text' : 'warning-text'}">${delta <= 0 ? '↓' : '↑'} ${Math.abs(delta)}%</span> from last month</p><canvas class="mini-chart" data-values="76,52,67,44,83,60,72,51" data-tone="coral" aria-label="Spending trend bars"></canvas></article>
      <article class="metric-card"><div class="metric-top"><span>Set aside</span><span class="metric-icon violet">✳</span></div><strong>${money(saved)}</strong><p><span class="positive-text">${rate}%</span> savings rate this month</p><div class="savings-track"><i style="width:${Math.max(4, Math.min(rate, 100))}%"></i></div><small class="track-caption">Goal: 20% <b>${Math.max(0, rate - 20)}% ahead</b></small></article>
    </section>
    <section class="dashboard-grid"><article class="panel spending-panel"><div class="panel-heading"><div><h2>Spending by category</h2><p>Where ${monthLabel(period).toLowerCase()} money is going</p></div><a href="#budgets" class="text-link">View budgets <span>↗</span></a></div><div class="category-chart-wrap">${categoryChart(state.transactions.filter((item) => item.type === 'expense' && inMonth(item.date))) }<div class="category-legend">${categoryLegend()}</div></div></article>
    <article class="panel budget-panel"><div class="panel-heading"><div><h2>Monthly budgets</h2><p>${state.budgets.length} categories <span class="muted">·</span> ${monthLabel(period)}</p></div><a href="#budgets" class="text-link">See all <span>↗</span></a></div>${budgetProgress().slice(0, 4)}</article>
    <article class="panel activity-panel"><div class="panel-heading"><div><h2>Recent activity</h2><p>Your latest household transactions</p></div><a href="#transactions" class="text-link">All activity <span>↗</span></a></div><div class="transaction-list">${transactionRows(recent, 5)}</div></article>
    <article class="panel insight-card"><div class="insight-orbit">✦</div><p class="eyebrow">A HELPFUL PATTERN</p><h2>Groceries are your<br>largest flexible category.</h2><p>You’ve spent <b>${money(categorySpent('Groceries'))}</b> on groceries this month, within a total of ${money(current.expense)} in household spending.</p><a href="#insights" class="text-link">Explore your insights <span>→</span></a></article></section><input class="file-picker" id="import-file" type="file" accept=".csv,text/csv">`;
}

function categorySpent(name) {
  return state.transactions.filter((item) => item.category === name && item.type === 'expense' && inMonth(item.date)).reduce((sum, item) => sum + Number(item.amount), 0);
}

function weeklySeries(type) {
  const monthEnd = new Date(period.getFullYear(), period.getMonth() + 1, 0, 23, 59, 59);
  const values = Array(8).fill(0);
  state.transactions.filter((item) => item.type === type).forEach((item) => {
    const age = Math.floor((monthEnd - new Date(`${item.date}T12:00:00`)) / (7 * 24 * 60 * 60 * 1000));
    if (age >= 0 && age < values.length) values[values.length - age - 1] += Number(item.amount);
  });
  const peak = Math.max(...values, 1);
  return values.map((value) => Math.round(value / peak * 100));
}

function cashFlowSeries() {
  const monthEnd = new Date(period.getFullYear(), period.getMonth() + 1, 0, 23, 59, 59);
  const values = Array(8).fill(0);
  state.transactions.forEach((item) => {
    const age = Math.floor((monthEnd - new Date(`${item.date}T12:00:00`)) / (7 * 24 * 60 * 60 * 1000));
    if (age >= 0 && age < values.length) values[values.length - age - 1] += (item.type === 'income' ? 1 : -1) * Number(item.amount);
  });
  const low = Math.min(...values), high = Math.max(...values);
  return values.map((value) => high === low ? 50 : Math.round(15 + (value - low) / (high - low) * 70));
}

function categoryLegend() {
  return categories.map((cat) => ({ ...cat, amount: categorySpent(cat.name) })).filter((cat) => cat.amount > 0).sort((a, b) => b.amount - a.amount).map((cat) => `<div><span class="legend-dot ${cat.tone}"></span><span>${cat.name}</span><b>${money(cat.amount)}</b></div>`).join('');
}

function budgetProgress() {
  return state.budgets.map((budget) => {
    const cat = categories.find((entry) => entry.name === budget.category) || categories.at(-1);
    const spent = categorySpent(budget.category);
    const percent = Math.round(spent / Math.max(1, budget.limit) * 100);
    const tone = percent > 100 ? 'over' : percent > 80 ? 'near' : '';
    return `<div class="budget-line"><div class="budget-line-top"><span class="category-icon tiny ${cat.tone}">${cat.icon}</span><b>${escapeHtml(budget.category)}</b><span>${money(spent)} <i>/ ${money(budget.limit)}</i></span></div><div class="progress"><i class="${tone}" style="width:${Math.min(100, percent)}%"></i></div></div>`;
  });
}

function transactionsPage() {
  const items = monthTransactions().filter((item) => filter === 'all' || item.type === filter);
  return `${header('Transactions', 'Every dollar, accounted for.', `<label class="button quiet csv-import" for="import-file">↥ Import CSV</label><button class="button quiet" data-action="export">↓ Export CSV</button><button class="button primary" data-action="add">＋ Add transaction</button>`)}<div class="transactions-toolbar">${monthControl()}<div class="filter-pills"><button data-filter="all" class="${filter === 'all' ? 'selected' : ''}">All</button><button data-filter="expense" class="${filter === 'expense' ? 'selected' : ''}">Expenses</button><button data-filter="income" class="${filter === 'income' ? 'selected' : ''}">Income</button></div><label class="search-box">⌕ <input id="search-transactions" placeholder="Search transactions" aria-label="Search transactions"></label></div><section class="panel full-list"><div class="panel-heading"><div><h2>${monthLabel(period)} activity</h2><p>${items.length} transactions <span class="muted">·</span> Income ${money(totals().income)} <span class="muted">·</span> Spent ${money(totals().expense)}</p></div></div><div class="transaction-list" id="transaction-list">${transactionRows(items)}</div></section><input class="file-picker" id="import-file" type="file" accept=".csv,text/csv">`;
}

function budgetsPage() {
  const totalLimit = state.budgets.reduce((sum, item) => sum + Number(item.limit), 0);
  const totalSpent = state.budgets.reduce((sum, item) => sum + categorySpent(item.category), 0);
  return `${header('Budgets', 'Give every part of your plan a little breathing room.', `<button class="button quiet" data-action="edit-budgets">⚙ <span>Adjust limits</span></button><button class="button primary" data-action="add">＋ <span>Add transaction</span></button>`)}<div class="overview-toolbar">${monthControl()}<span class="period-note">Monthly plan <b>${money(totalLimit)} total</b></span></div><section class="budget-summary"><div><small>Planned this month</small><b>${money(totalLimit)}</b></div><div><small>Spent so far</small><b>${money(totalSpent)}</b></div><div><small>Left to spend</small><b>${money(totalLimit - totalSpent)}</b></div><div class="summary-ring"><span>${Math.round(totalSpent / totalLimit * 100)}<small>% used</small></span></div></section><section class="panel budget-full"><div class="panel-heading"><div><h2>Your category plan</h2><p>Limits reset at the start of each month.</p></div><span class="status-pill">${state.budgets.length} active</span></div><div class="budget-grid">${state.budgets.map((budget) => budgetCard(budget)).join('')}</div></section><section class="tip-strip"><span>✦</span><p><b>Room to adjust.</b> Your limits are guide rails, not rules. Change them whenever your household needs a different plan.</p><button class="text-link" data-action="edit-budgets">Edit limits →</button></section>`;
}

function budgetCard(budget) {
  const cat = categories.find((entry) => entry.name === budget.category) || categories.at(-1);
  const spent = categorySpent(budget.category);
  const left = Number(budget.limit) - spent;
  const pct = Math.round(spent / budget.limit * 100);
  return `<article class="budget-card"><div class="budget-card-title"><span class="category-icon ${cat.tone}">${cat.icon}</span><div><h3>${escapeHtml(budget.category)}</h3><small>${money(budget.limit)} monthly limit</small></div><button data-action="edit-limit" data-category="${escapeHtml(budget.category)}" aria-label="Edit ${escapeHtml(budget.category)} budget">···</button></div><div class="budget-amount"><b>${money(spent)}</b><span>spent</span></div><div class="progress large"><i class="${pct > 100 ? 'over' : pct > 80 ? 'near' : ''}" style="width:${Math.min(100, pct)}%"></i></div><div class="budget-card-foot"><span>${Math.max(0, pct)}% used</span><b class="${left < 0 ? 'warning-text' : ''}">${left < 0 ? `${money(Math.abs(left))} over` : `${money(left)} left`}</b></div></article>`;
}

function insightsPage() {
  const current = totals();
  const previous = totals(-1);
  const diff = current.expense - previous.expense;
  const sorted = categories.map((cat) => ({ ...cat, amount: categorySpent(cat.name) })).sort((a, b) => b.amount - a.amount);
  return `${header('Insights', 'Patterns that make the next money decision easier.', `<button class="button quiet" data-action="export">↓ <span>Download report</span></button>`)}<div class="overview-toolbar">${monthControl()}<span class="period-note">Compared with ${monthLabel(new Date(period.getFullYear(), period.getMonth() - 1, 1))}</span></div><section class="insight-summary"><div><span class="metric-icon coral">↗</span><small>Total spending</small><b>${money(current.expense)}</b><p class="${diff <= 0 ? 'positive-text' : 'warning-text'}">${diff <= 0 ? '↓' : '↑'} ${money(Math.abs(diff))} ${diff <= 0 ? 'less' : 'more'} than last month</p></div><div><span class="metric-icon green">✳</span><small>Savings rate</small><b>${current.income ? Math.round((current.income - current.expense) / current.income * 100) : 0}%</b><p>Goal: 20% of take-home income</p></div><div><span class="metric-icon violet">◷</span><small>Daily average</small><b>${money(current.expense / Math.max(1, new Date(period.getFullYear(), period.getMonth() + 1, 0).getDate()))}</b><p>Based on the full month plan</p></div></section><div class="dashboard-grid insight-layout"><article class="panel trend-panel"><div class="panel-heading"><div><h2>Cash flow over time</h2><p>Net household flow across recent weeks</p></div><span class="legend-inline"><i></i> Net cash flow</span></div>${sparkline(cashFlowSeries(), 'large-chart')}</article><article class="panel category-breakdown"><div class="panel-heading"><div><h2>Where it goes</h2><p>Month-to-date spending</p></div></div>${sorted.map((cat) => `<div class="breakdown-row"><span class="category-icon tiny ${cat.tone}">${cat.icon}</span><span>${cat.name}</span><b>${money(cat.amount)}</b></div>`).join('')}</article></div><section class="panel coaching-note"><span class="insight-orbit">✦</span><div><p class="eyebrow">YOUR MONTHLY NOTE</p><h2>Small habits add up.</h2><p>Your household has set aside ${money(current.income - current.expense)} this month. Keeping that pace would build a ${money((current.income - current.expense) * 12)} cushion over a year.</p></div></section>`;
}

function accountsPage() {
  return `${header('Accounts', 'A simple view of the places your household keeps money.', `<button class="button primary" data-action="add-account">＋ Add account</button>`)}<div class="account-total"><small>Combined available balance</small><b>${money(accountList.reduce((sum, account) => sum + Number(account.balance), 0))}</b><span>Across ${accountList.length} household accounts</span></div><section class="account-grid">${accountList.map((account) => `<article class="panel account-card"><div class="account-icon ${account.tone}">${account.icon}</div><div class="account-info"><small>${escapeHtml(account.kind)}</small><h2>${escapeHtml(account.name)}</h2><span>•••• ${account.last4}</span></div><b>${money(account.balance)}</b><button data-action="account-menu" data-account="${escapeHtml(account.name)}" aria-label="Options for ${escapeHtml(account.name)}">···</button></article>`).join('')}</section><div class="offline-note"><span>⌁</span><p><b>Private by design.</b> Commonplace stores your account list only in this browser. No bank connection is made.</p></div>`;
}

function settingsPage() {
  return `${header('Settings', 'Make Commonplace work the way your household does.', '')}<section class="panel settings-panel"><div class="settings-row"><div><h2>Display currency</h2><p>Changes the unit label only; amounts are not converted.</p></div><select id="currency-setting"><option value="USD">US Dollar · USD</option><option value="CAD">Canadian Dollar · CAD</option><option value="GBP">British Pound · GBP</option><option value="EUR">Euro · EUR</option></select></div><div class="settings-row"><div><h2>Household name</h2><p>The name shown at the top of your budget.</p></div><div class="setting-input"><input id="household-name" value="${escapeHtml(localStorage.getItem('commonplace-household') || 'The Parkers')}" maxlength="32"><button class="text-link" data-action="save-household">Save</button></div></div><div class="settings-row"><div><h2>Sample transactions</h2><p>Restore the realistic example ledger on this device.</p></div><button class="button quiet" data-action="reset">Restore sample data</button></div><div class="settings-row"><div><h2>Your data</h2><p>Stored in this browser only. Export a CSV backup any time.</p></div><button class="button quiet" data-action="export">Download backup</button></div></section><section class="panel about-panel"><span class="brand-mark">c</span><div><b>Commonplace</b><p>Good money habits start with a clear picture.</p><small>Version 1.0 · Works offline · No account required</small></div></section>`;
}

function pageTemplate() {
  const pages = { overview, transactions: transactionsPage, budgets: budgetsPage, insights: insightsPage, accounts: accountsPage, settings: settingsPage };
  return (pages[activePage] || overview)();
}

function render() {
  window.__shotReady = false;
  app.innerHTML = pageTemplate();
  app.querySelectorAll('.mini-chart').forEach((canvas) => { canvas.dataset.values = weeklySeries(canvas.dataset.tone === 'coral' ? 'expense' : 'income').join(','); });
  app.querySelectorAll('.sparkline').forEach((canvas) => { canvas.dataset.series = cashFlowSeries().join(','); });
  const chartTransactions = state.transactions.filter((item) => item.type === 'expense' && inMonth(item.date));
  drawCharts(chartTransactions);
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.page === activePage));
  document.querySelector('.nav-link[data-page="transactions"] i').textContent = monthTransactions().length;
  document.querySelector('.home-switch b').textContent = localStorage.getItem('commonplace-household') || 'The Parkers';
  const currency = document.querySelector('#currency-setting');
  if (currency) currency.value = localStorage.getItem('commonplace-currency') || 'USD';
  document.title = `${activePage[0].toUpperCase()}${activePage.slice(1)} · Commonplace`;
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function openEntry(item = null) {
  const form = document.querySelector('#entry-form');
  form.reset();
  document.querySelector('#entry-category').innerHTML = categories.map((cat) => `<option>${cat.name}</option>`).join('');
  document.querySelector('#entry-id').value = item?.id || '';
  document.querySelector('#dialog-title').textContent = item ? 'Edit transaction' : 'Add transaction';
  document.querySelector('#entry-name').value = item?.name || '';
  document.querySelector('#entry-amount').value = item?.amount || '';
  document.querySelector('#entry-type').value = item?.type || 'expense';
  document.querySelector('#entry-category').value = item?.category || 'Groceries';
  document.querySelector('#entry-date').value = item?.date || new Date().toISOString().slice(0, 10);
  document.querySelector('#entry-account').value = item?.account || 'Everyday checking';
  document.querySelector('#delete-entry').classList.toggle('hidden', !item);
  dialog.showModal();
}

function saveEntry(event) {
  event.preventDefault();
  const id = document.querySelector('#entry-id').value;
  const item = { id: id || crypto.randomUUID(), name: document.querySelector('#entry-name').value.trim(), amount: Number(document.querySelector('#entry-amount').value), type: document.querySelector('#entry-type').value, category: document.querySelector('#entry-category').value, date: document.querySelector('#entry-date').value, account: document.querySelector('#entry-account').value };
  state.transactions = id ? state.transactions.map((entry) => entry.id === id ? item : entry) : [item, ...state.transactions];
  persist();
  dialog.close();
  render();
  showToast(id ? 'Transaction updated.' : 'Transaction added.');
}

function requestDelete(item) {
  const confirmDialog = document.querySelector('#confirm-dialog');
  document.querySelector('#confirm-title').textContent = 'Delete this transaction?';
  document.querySelector('#confirm-copy').textContent = `${item.name} · ${money(item.amount)} will be removed from your local ledger.`;
  const yes = document.querySelector('#confirm-yes');
  yes.onclick = (event) => {
    event.preventDefault();
    state.transactions = state.transactions.filter((entry) => entry.id !== item.id);
    persist();
    confirmDialog.close();
    dialog.close();
    render();
    showToast('Transaction deleted.');
  };
  confirmDialog.showModal();
}

function exportCsv() {
  const headerLine = 'Date,Description,Type,Category,Amount,Account';
  const rows = state.transactions.map((item) => [item.date, item.name, item.type, item.category, item.amount, item.account].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
  download(`${headerLine}\n${rows.join('\n')}`, `commonplace-transactions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  showToast('CSV backup downloaded.');
}

function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const records = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); if (row.some(Boolean)) records.push(row); row = []; field = '';
    } else field += char;
  }
  row.push(field); if (row.some(Boolean)) records.push(row);
  const columns = records.shift()?.map((value) => value.trim().toLowerCase()) || [];
  const index = (names) => columns.findIndex((name) => names.includes(name));
  const indexes = { date: index(['date']), name: index(['description', 'name']), type: index(['type']), category: index(['category']), amount: index(['amount']), account: index(['account']) };
  if (indexes.date < 0 || indexes.name < 0 || indexes.amount < 0) throw new Error('CSV needs Date, Description, and Amount columns.');
  return records.map((values) => {
    const rawAmount = Number(String(values[indexes.amount] || '').replace(/[$,]/g, ''));
    const rawType = indexes.type < 0 ? (rawAmount < 0 ? 'expense' : 'income') : (values[indexes.type] || '').toLowerCase();
    const date = values[indexes.date];
    if (!date || !values[indexes.name] || !Number.isFinite(rawAmount)) return null;
    return { id: crypto.randomUUID(), date, name: values[indexes.name], type: rawType.includes('income') || rawAmount < 0 && indexes.type < 0 ? 'income' : 'expense', category: values[indexes.category] || 'Other', amount: Math.abs(rawAmount), account: values[indexes.account] || 'Everyday checking' };
  }).filter(Boolean);
}

function adjustBudget(category) {
  const item = state.budgets.find((budget) => budget.category === category);
  const next = prompt(`Monthly limit for ${category}`, String(item?.limit || 0));
  if (next === null) return;
  const value = Number(next);
  if (!Number.isFinite(value) || value <= 0) { showToast('Enter a limit greater than zero.'); return; }
  if (item) item.limit = value;
  else state.budgets.push({ category, limit: value });
  persist(); render(); showToast(`${category} budget updated.`);
}

function handleAction(button) {
  const action = button.dataset.action;
  if (action === 'prev-month') changeMonth(-1);
  if (action === 'next-month') changeMonth(1);
  if (action === 'add') openEntry();
  if (action === 'edit') openEntry(state.transactions.find((item) => item.id === button.dataset.id));
  if (action === 'export') exportCsv();
  if (action === 'import') document.querySelector('#import-file').click();
  if (action === 'edit-limit') adjustBudget(button.dataset.category);
  if (action === 'edit-budgets') adjustBudget(prompt('Which category would you like to adjust?', 'Groceries') || 'Groceries');
  if (action === 'reset') { if (confirm('Restore the original sample transactions and budgets? This replaces the data on this device.')) { localStorage.removeItem(STORE); localStorage.removeItem('commonplace-accounts'); state = loadState(); accountList = accounts.map((account) => ({ ...account })); render(); showToast('Sample data restored.'); } }
  if (action === 'save-household') { localStorage.setItem('commonplace-household', document.querySelector('#household-name').value.trim() || 'Our household'); render(); showToast('Household name saved.'); }
  if (action === 'add-account') { const name = prompt('Name this household account'); if (!name?.trim()) return; const balance = Number(prompt('Current balance in dollars', '0')); if (!Number.isFinite(balance)) { showToast('Enter a valid balance.'); return; } accountList.push({ name: name.trim(), kind: 'Manual account · Household', last4: String(Math.floor(1000 + Math.random() * 9000)), balance, icon: '◈', tone: 'mint' }); localStorage.setItem('commonplace-accounts', JSON.stringify(accountList)); render(); showToast('Household account added.'); }
  if (action === 'account-menu') showToast(`${button.dataset.account} is tracked locally.`);
  if (action === 'privacy-info') showToast('Your budget stays in this browser; no bank connection is made.');
  if (action === 'profile-menu') showToast(`You are managing ${localStorage.getItem('commonplace-household') || 'The Parkers'} household.`);
  if (action === 'house-switch') { const name = prompt('Name this household', localStorage.getItem('commonplace-household') || 'The Parkers'); if (name?.trim()) { localStorage.setItem('commonplace-household', name.trim()); render(); showToast('Household name updated.'); } }
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('.nav-link');
  if (nav) { activePage = nav.dataset.page; return; }
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) { filter = filterButton.dataset.filter; render(); return; }
  const button = event.target.closest('[data-action]');
  if (button) handleAction(button);
});

document.querySelector('#entry-form').addEventListener('submit', saveEntry);
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#delete-entry').addEventListener('click', () => {
  const item = state.transactions.find((entry) => entry.id === document.querySelector('#entry-id').value);
  if (item) requestDelete(item);
});
document.addEventListener('change', async (event) => {
  if (event.target.id === 'currency-setting') { localStorage.setItem('commonplace-currency', event.target.value); render(); showToast('Display currency updated.'); return; }
  if (event.target.id !== 'import-file' || !event.target.files?.[0]) return;
  try {
    const rows = parseCsv(await event.target.files[0].text());
    if (!rows.length) throw new Error('No usable transaction rows found.');
    state.transactions = [...rows, ...state.transactions]; persist(); render(); showToast(`${rows.length} transactions imported.`);
  } catch (error) { showToast(error.message); }
  event.target.value = '';
});
document.addEventListener('input', (event) => {
  if (event.target.id !== 'search-transactions') return;
  const query = event.target.value.trim().toLowerCase();
  const rows = monthTransactions().filter((item) => (filter === 'all' || item.type === filter) && `${item.name} ${item.category} ${item.account}`.toLowerCase().includes(query));
  const list = document.querySelector('#transaction-list');
  if (list) list.innerHTML = transactionRows(rows);
});
window.addEventListener('hashchange', () => { activePage = location.hash.slice(1) || 'overview'; render(); });
render();
