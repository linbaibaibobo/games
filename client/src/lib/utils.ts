import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getLocalizedField(
  obj: any,
  field: string,
  language: string
): string {
  const langMap: { [key: string]: string } = {
    en: 'en',
    zh: 'zh',
    ja: 'ja',
    ko: 'ko',
    ru: 'ru',
  }

  const lang = langMap[language] || 'en'
  const localizedField = `${field}_${lang}`

  return obj[localizedField] || obj[`${field}_en`] || obj[field] || ''
}

export function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}
