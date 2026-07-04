export interface ContractVariableData {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  photographerName?: string;
  companyName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  packageName?: string;
  totalAmount?: number | string;
  retainerAmount?: number | string;
  todayDate?: string;
  customAnswers?: Record<string, any>;
}

export function processContractVariables(html: string, data: ContractVariableData): string {
  if (!html) return '';

  const clientName = data.clientName || data.customAnswers?.['Full Name'] || data.customAnswers?.['Name'] || data.customAnswers?.['name'] || '[Client Name]';
  const clientEmail = data.clientEmail || data.customAnswers?.['Email Address'] || data.customAnswers?.['Email'] || data.customAnswers?.['email'] || '[Client Email]';
  const clientPhone = data.clientPhone || data.customAnswers?.['Phone Number'] || data.customAnswers?.['Phone'] || data.customAnswers?.['phone'] || '';
  const photogName = data.photographerName || data.companyName || 'Photographer';
  const eventDate = data.eventDate || '[Event Date]';
  const eventTime = data.eventTime || '[Event Time]';
  const eventLocation = data.eventLocation || data.customAnswers?.['Venue'] || data.customAnswers?.['Location'] || data.customAnswers?.['Event Location'] || '';
  const pkgName = data.packageName || '[Package Name]';

  const formatMoney = (val: number | string | undefined, defaultStr: string) => {
    if (val === undefined || val === null || val === '') return defaultStr;
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, '')) : val;
    if (isNaN(num)) return typeof val === 'string' ? val : defaultStr;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalStr = formatMoney(data.totalAmount, '[Total Amount]');
  const retainerStr = formatMoney(
    data.retainerAmount !== undefined ? data.retainerAmount : (typeof data.totalAmount === 'number' ? data.totalAmount * 0.5 : undefined),
    '[Retainer Amount]'
  );
  const todayStr = data.todayDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const dictionary: Record<string, string> = {
    'client name': clientName,
    'full name': clientName,
    'client_name': clientName,
    'name': clientName,
    'client email': clientEmail,
    'email': clientEmail,
    'email address': clientEmail,
    'client phone': clientPhone,
    'phone': clientPhone,
    'phone number': clientPhone,
    'photographer name': photogName,
    'photographer': photogName,
    'company name': photogName,
    'event date': eventDate,
    'contract date': todayStr,
    'effective date': todayStr,
    'today\'s date': todayStr,
    'todays date': todayStr,
    'date': eventDate !== '[Event Date]' ? eventDate : todayStr,
    'event time': eventTime,
    'time': eventTime,
    'event location': eventLocation,
    'venue': eventLocation,
    'location': eventLocation,
    'package name': pkgName,
    'package': pkgName,
    'total amount': totalStr,
    'total': totalStr,
    'price': totalStr,
    'amount': totalStr,
    'retainer amount': retainerStr,
    'retainer': retainerStr,
    'deposit': retainerStr,
  };

  if (data.customAnswers) {
    Object.entries(data.customAnswers).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        dictionary[k.trim().toLowerCase()] = String(v);
      }
    });
  }

  const lookupVal = (keyStr: string): string | null => {
    if (!keyStr) return null;
    const cleanKey = keyStr.trim().toLowerCase();
    if (dictionary[cleanKey] !== undefined && dictionary[cleanKey] !== '') {
      return dictionary[cleanKey];
    }
    for (const [dictKey, dictVal] of Object.entries(dictionary)) {
      if (dictVal && (cleanKey.includes(dictKey) || dictKey.includes(cleanKey))) {
        return dictVal;
      }
    }
    return null;
  };

  let processed = html;

  // 1. Replace TipTap span variables (<span data-variable="true" ...>...</span>)
  processed = processed.replace(/<span[^>]*data-variable="true"[^>]*>.*?<\/span>/gi, (match) => {
    const labelMatch = match.match(/label="([^"]+)"/i);
    const label = labelMatch ? labelMatch[1] : '';
    const val = lookupVal(label);
    if (val && !val.startsWith('[')) {
      return `<strong style="color:#0f172a; font-weight:800; border-bottom:1px solid #0f172a;">${val}</strong>`;
    }
    return match;
  });

  processed = processed.replace(/<span[^>]*label="([^"]+)"[^>]*>.*?<\/span>/gi, (match) => {
    if (match.includes('data-variable')) {
      const labelMatch = match.match(/label="([^"]+)"/i);
      const label = labelMatch ? labelMatch[1] : '';
      const val = lookupVal(label);
      if (val && !val.startsWith('[')) {
        return `<strong style="color:#0f172a; font-weight:800; border-bottom:1px solid #0f172a;">${val}</strong>`;
      }
    }
    return match;
  });

  // 2. Replace Bracket & Curly tags ([Var] and {{Var}} and {Var})
  processed = processed.replace(/\[([^\]]+)\]/g, (match, key) => {
    const val = lookupVal(key);
    return val ? val : match;
  });

  processed = processed.replace(/\{\{([^\}]+)\}\}/g, (match, key) => {
    const val = lookupVal(key);
    return val ? val : match;
  });

  processed = processed.replace(/\{([^\}]+)\}/g, (match, key) => {
    const val = lookupVal(key);
    return val ? val : match;
  });

  return processed;
}

export function syncContractFormDOM(containerEl: HTMLElement | null) {
  if (!containerEl) return;
  const inputs = containerEl.querySelectorAll('input, select, textarea');
  inputs.forEach((el: any) => {
    if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.checked) {
        el.setAttribute('checked', 'checked');
      } else {
        el.removeAttribute('checked');
      }
    } else if (el.tagName === 'SELECT') {
      Array.from(el.options).forEach((opt: any) => {
        if (opt.selected) opt.setAttribute('selected', 'selected');
        else opt.removeAttribute('selected');
      });
    } else {
      el.setAttribute('value', el.value);
    }
  });
}

export function validateRequiredInputs(containerEl: HTMLElement | null): boolean {
  if (!containerEl) return true;
  const requiredElements = containerEl.querySelectorAll('[required], [data-required="true"], input[type="checkbox"]:not([data-required="false"])');
  for (const el of Array.from(requiredElements)) {
    const inputEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (inputEl.type === 'checkbox' || inputEl.type === 'radio') {
      if (!(inputEl as HTMLInputElement).checked) {
        let labelText = inputEl.getAttribute('data-label') || '';
        if (!labelText) {
          const parentText = inputEl.parentElement?.textContent?.trim() || '';
          labelText = parentText || 'required checkbox';
        }
        alert(`Please accept: "${labelText.slice(0, 80)}${labelText.length > 80 ? '...' : ''}"`);
        return false;
      }
    } else {
      if (!inputEl.value.trim()) {
        const labelText = inputEl.getAttribute('placeholder') || inputEl.getAttribute('data-label') || 'required field';
        alert(`Please fill in: "${labelText}"`);
        return false;
      }
    }
  }
  return true;
}
