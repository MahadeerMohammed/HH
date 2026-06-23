export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value ?? 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2
  }).format(value ?? 0);

export const formatPercent = (value: number) => `${formatNumber(value)}%`;

export const formatDate = (value: string) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
};

export const today = () => new Date().toISOString().slice(0, 10);

export const currentMonthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
};
