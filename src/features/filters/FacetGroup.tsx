import { useMemo, useState } from 'react';
import type { FacetOption } from '../../lib/facets';
import type { FacetKey } from '../../lib/facets';
import { useStore } from '../../lib/store';

interface Props {
  title: string;
  facet: FacetKey;
  options: FacetOption[];
  /** Render a swatch for facets that carry a colour encoding on the map. */
  colorOf?: (value: string) => string | undefined;
  labelOf?: (value: string) => string;
  /** Long lists (51 operators, 88 localities) get a filter box and a cap. */
  searchable?: boolean;
  initialVisible?: number;
  defaultOpen?: boolean;
}

export function FacetGroup({
  title, facet, options, colorOf, labelOf,
  searchable = false, initialVisible = 8, defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useStore((s) => s.filters[facet]);
  const toggleFacet = useStore((s) => s.toggleFacet);
  const clearFacet = useStore((s) => s.clearFacet);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.value.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const shown = expanded || query ? filtered : filtered.slice(0, initialVisible);
  const hidden = filtered.length - shown.length;

  return (
    <section className={`facet ${open ? 'is-open' : ''}`}>
      <header className="facet__head">
        <button className="facet__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          <svg className="facet__chevron" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M3 1.5 L6.5 5 L3 8.5" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{title}</span>
        </button>
        {selected.length > 0 && (
          <button className="facet__clear" onClick={() => clearFacet(facet)}>
            {selected.length} · clear
          </button>
        )}
      </header>

      {open && (
        <div className="facet__body">
          {searchable && options.length > initialVisible && (
            <input
              className="facet__search"
              placeholder={`Filter ${title.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}

          <ul className="facet__list">
            {shown.map((opt) => {
              const isOn = selected.includes(opt.value);
              const color = colorOf?.(opt.value);
              return (
                <li key={opt.value}>
                  <label className={`facet__opt ${isOn ? 'is-on' : ''} ${opt.count === 0 ? 'is-empty' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggleFacet(facet, opt.value)}
                    />
                    <span className="facet__box" aria-hidden="true">
                      <svg viewBox="0 0 12 12"><path d="M2.5 6.2 L4.8 8.5 L9.5 3.5"
                        fill="none" stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    {color && <span className="dot" style={{ background: color }} />}
                    <span className="facet__label" title={opt.value}>
                      {labelOf ? labelOf(opt.value) : opt.value}
                    </span>
                    <span className="facet__count">{opt.count}</span>
                  </label>
                </li>
              );
            })}
            {!shown.length && <li className="facet__none">No matches</li>}
          </ul>

          {hidden > 0 && !query && (
            <button className="facet__more" onClick={() => setExpanded(true)}>
              Show {hidden} more
            </button>
          )}
          {expanded && !query && filtered.length > initialVisible && (
            <button className="facet__more" onClick={() => setExpanded(false)}>Show less</button>
          )}
        </div>
      )}
    </section>
  );
}
