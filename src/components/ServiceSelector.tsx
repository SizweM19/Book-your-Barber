import React, { useState } from 'react';
import { Clock, Plus, Check, Flame } from 'lucide-react';
import { ServiceItem, ServiceCategory } from '../types';

interface ServiceSelectorProps {
  services: ServiceItem[];
  selectedServiceIds: string[];
  onToggleService: (serviceId: string) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServiceIds,
  onToggleService,
}) => {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');

  const categories: { key: ServiceCategory; label: string }[] = [
    { key: 'all', label: 'All Services' },
    { key: 'haircuts', label: 'Haircuts' },
    { key: 'beards', label: 'Beards & Shaves' },
    { key: 'combos', label: 'Packages & Combos' },
    { key: 'treatments', label: 'Spa & Treatments' },
  ];

  const filteredServices = services.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <span>2. Select Services</span>
            {selectedServiceIds.length > 0 && (
              <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold">
                {selectedServiceIds.length} Selected
              </span>
            )}
          </h2>
          <p className="text-sm text-stone-400">
            Combine a signature cut with beard maintenance or revitalizing spa care.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.key}
            id={`cat-filter-${cat.key}`}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              activeCategory === cat.key
                ? 'bg-stone-100 text-stone-900 border-stone-100 font-semibold shadow-sm'
                : 'bg-stone-800/80 text-stone-400 border-stone-700/60 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredServices.map((service) => {
          const isSelected = selectedServiceIds.includes(service.id);
          return (
            <div
              key={service.id}
              id={`service-card-${service.id}`}
              onClick={() => onToggleService(service.id)}
              className={`rounded-xl p-4 transition-all cursor-pointer border flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500'
                  : 'bg-stone-850/70 border-stone-800 hover:border-stone-700 hover:bg-stone-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-100 text-base">
                      {service.name}
                    </h3>
                    {service.popular && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Flame className="w-3 h-3 text-amber-400" />
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-amber-400 font-display">
                    R{service.price}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-400 justify-end mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{service.durationMinutes}m</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-800/60 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 capitalize">
                  {service.category}
                </span>

                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
