export const formatPrice = (price: number): string => {
return new Intl.NumberFormat('id-ID', {
style: 'currency',
currency: 'IDR',
minimumFractionDigits: 0,
}).format(price);
};

export const formatDate = (dateString: string): string => {
const date = new Date(dateString);
return date.toLocaleDateString('id-ID', {
day: 'numeric',
month: 'long',
year: 'numeric',
});
};

export const formatDateTime = (dateString: string): string => {
const date = new Date(dateString);
return date.toLocaleString('id-ID', {
day: 'numeric',
month: 'long',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
});
};
