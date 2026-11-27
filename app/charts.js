export function money(value) {
  const currency = localStorage.getItem('commonplace-currency') || 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export function sparkline(values, extraClass = '') {
  return `<canvas class="sparkline ${extraClass}" data-series="${values.join(',')}" aria-label="Household cash flow trend" role="img"></canvas>`;
}

export function categoryChart(transactions) {
  return `<div class="donut-wrap"><canvas id="category-chart" class="donut" aria-label="Spending by category donut chart" role="img"></canvas><div class="donut-center"><b>${money(transactions.reduce((sum, item) => sum + Number(item.amount), 0))}</b><small>Total spent</small></div></div>`;
}

export function drawCharts(transactions = []) {
  document.querySelectorAll('canvas.sparkline').forEach((canvas) => {
    const values = canvas.dataset.series.split(',').map(Number);
    const context = prepareCanvas(canvas);
    const width = canvas.clientWidth, height = canvas.clientHeight;
    context.strokeStyle = '#598a73'; context.lineWidth = Math.max(1.5, height * .055); context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath();
    values.forEach((value, index) => {
      const x = index / Math.max(1, values.length - 1) * width;
      const y = height - (value / 100 * (height * .8)) - height * .1;
      if (!index) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.stroke();
    context.lineTo(width, height); context.lineTo(0, height); context.closePath();
    const fill = context.createLinearGradient(0, 0, 0, height); fill.addColorStop(0, '#77a78955'); fill.addColorStop(1, '#77a78900');
    context.fillStyle = fill; context.fill();
  });
  document.querySelectorAll('canvas.mini-chart').forEach((canvas) => {
    const values = canvas.dataset.values.split(',').map(Number);
    const context = prepareCanvas(canvas);
    const width = canvas.clientWidth, height = canvas.clientHeight, gap = 4;
    const barWidth = (width - gap * (values.length - 1)) / values.length;
    context.fillStyle = canvas.dataset.tone === 'coral' ? '#efd3c5' : '#c8ddcd';
    values.forEach((value, index) => {
      const barHeight = (height - 2) * value / 100;
      context.beginPath(); context.roundRect(index * (barWidth + gap), height - barHeight, barWidth, barHeight, [3, 3, 0, 0]); context.fill();
    });
  });
  const donut = document.querySelector('#category-chart');
  if (donut) {
    const context = prepareCanvas(donut); const width = donut.clientWidth, height = donut.clientHeight;
    const centerX = width / 2, centerY = height / 2, radius = Math.min(width, height) * .38, thickness = Math.min(width, height) * .14;
    const palette = { Groceries: '#76a890', Housing: '#9c8bbc', Transport: '#e3a37e', Utilities: '#83a8bc', Dining: '#d58d9b', Health: '#9dba82', Family: '#d2bb77', Other: '#a6a9a1' };
    const sums = new Map();
    transactions.forEach((item) => sums.set(item.category, (sums.get(item.category) || 0) + Number(item.amount)));
    const amounts = [...sums.entries()];
    const total = amounts.reduce((sum, entry) => sum + entry[1], 0) || 1;
    let angle = -Math.PI / 2;
    amounts.forEach(([category, amount]) => {
      const nextAngle = angle + amount / total * Math.PI * 2;
      context.beginPath(); context.arc(centerX, centerY, radius, angle, nextAngle); context.strokeStyle = palette[category] || '#a6a9a1'; context.lineWidth = thickness; context.lineCap = 'butt'; context.stroke(); angle = nextAngle;
    });
  }
}

function prepareCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1, width = canvas.clientWidth, height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext('2d'); context.scale(ratio, ratio); return context;
}
