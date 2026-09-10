const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const PAD = (n) => `${n}`.padStart(2, '0');

export function formatCurrency(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '₹0';
  const parts = number.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimal = parts[1] ? `.${parts[1]}` : '';
  return `₹${intPart}${decimal}`;
}

export function formatDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const day = PAD(d.getDate());
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = PAD(d.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`;
}

export function formatShortDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const day = PAD(d.getDate());
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTime(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const hours = d.getHours();
  const minutes = PAD(d.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export default {
  formatCurrency,
  formatDate,
  formatShortDate,
  formatTime
};
