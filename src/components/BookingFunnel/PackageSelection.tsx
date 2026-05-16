'use client';
import React from 'react';
import { Check, Plus } from 'lucide-react';

interface Props {
  packages: any[];
  selectedPackage: any;
  setSelectedPackage: (pkg: any) => void;
  selectedAddons: any[];
  setSelectedAddons: React.Dispatch<React.SetStateAction<any[]>>;
  onNext: () => void;
  funnelSettings: any;
}

export default function PackageSelection({ packages, selectedPackage, setSelectedPackage, selectedAddons, setSelectedAddons, onNext, funnelSettings }: Props) {
  
  // Use custom addons from funnel settings, fall back to defaults if empty
  const addons = funnelSettings?.addons?.length > 0
    ? funnelSettings.addons
    : [
        { id: 'a1', name: 'Drone Footage', price: 300, desc: 'Aerial shots of your venue and couples portraits.' },
        { id: 'a2', name: 'Expedited Delivery', price: 500, desc: 'Receive your final gallery and films within 7 days.' },
        { id: 'a3', name: 'Raw Footage on Hard Drive', price: 250, desc: 'All unedited video clips provided on a physical drive.' }
      ];

  const step = funnelSettings?.steps?.[0];
  const title = step?.title || 'Choose Your Experience';
  const subtitle = step?.subtitle || 'Select the collection that perfectly fits your day. All packages include a pre-wedding consultation and timeline planning.';

  const toggleAddon = (addon: any) => {
    const exists = selectedAddons.find(a => a.id === addon.id);
    if (exists) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const parseItems = (itemsStr: string) => {
    if (!itemsStr) return [];
    if (itemsStr.startsWith('[')) {
      try { return JSON.parse(itemsStr); } catch { return []; }
    }
    return itemsStr.split('\n').filter(Boolean);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 600, margin: '0 auto' }}>{subtitle}</p>
      </div>

      {/* Packages Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
        {packages.map(pkg => {
          const isSelected = selectedPackage?.Package_ID === pkg.Package_ID;
          return (
            <div 
              key={pkg.Package_ID}
              onClick={() => setSelectedPackage(pkg)}
              style={{ 
                background: '#fff', 
                border: isSelected ? '3px solid #0d9488' : '1px solid #e5e7eb',
                borderRadius: 16, 
                padding: 32, 
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 10px 30px rgba(13, 148, 136, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)',
                transform: isSelected ? 'translateY(-4px)' : 'none',
                position: 'relative'
              }}
            >
              {isSelected && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0d9488', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={14} /> SELECTED
                </div>
              )}
              <h3 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>{pkg.Name}</h3>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#0d9488', marginBottom: 8 }}>
                ${(pkg.Price || 0).toLocaleString()}
              </div>
              {pkg.Duration && <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{pkg.Duration} Coverage</div>}
              
              <div style={{ height: 1, background: '#e5e7eb', margin: '24px 0' }} />
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {parseItems(pkg.Items).map((item: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#4b5563', lineHeight: 1.4 }}>
                    <Check size={18} color="#0d9488" style={{ marginTop: 2, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Add-ons Section */}
      {addons.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e5e7eb', marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 20px' }}>Optional Enhancements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {addons.map((addon: any) => {
              const isSelected = selectedAddons.some(a => a.id === addon.id);
              return (
                <div 
                  key={addon.id}
                  onClick={() => toggleAddon(addon)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 20, border: isSelected ? '2px solid #0d9488' : '1px solid #e5e7eb',
                    borderRadius: 12, cursor: 'pointer', background: isSelected ? '#f0fdfa' : '#fff',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{addon.name}</h4>
                      <span style={{ background: '#e5e7eb', color: '#374151', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>+${addon.price}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{addon.desc}</p>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border: isSelected ? 'none' : '2px solid #d1d5db', background: isSelected ? '#0d9488' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {isSelected ? <Check size={14} /> : <Plus size={14} color="#9ca3af" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
        <button 
          onClick={onNext}
          disabled={!selectedPackage}
          style={{
            background: selectedPackage ? '#111827' : '#e5e7eb',
            color: selectedPackage ? '#fff' : '#9ca3af',
            padding: '16px 32px', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 800,
            cursor: selectedPackage ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
          }}
        >
          Next: Event Details
        </button>
      </div>
    </div>
  );
}
