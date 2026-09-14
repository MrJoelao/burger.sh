/**
 * RestaurantListPage - Paginated list of restaurants with search/filter
 * Main restaurant discovery page
 */

import { html } from '../../utils/htm.js';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { RestaurantCard } from './RestaurantCard.jsx';
import { RestaurantSearch } from './RestaurantSearch.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { Loading } from '../../components/UI/Loading.jsx';
import { restaurantService } from '../../services/restaurantService.js';

export function RestaurantListPage({ onRestaurantSelect = () => {} }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    dishName: ''
  });

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      // Remove empty filters
      Array.from(params.entries()).forEach(([key, value]) => {
        if (!value) params.delete(key);
      });

      const data = await restaurantService.getRestaurants({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (data.success) {
        setRestaurants(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch restaurants');
      }
    } catch (err) {
      setError(err.message);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClear = () => {
    setFilters({ name: '', city: '', dishName: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console" aria-label="Burger.sh Restaurants">
      <header class="titlebar">
        <div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div>
        <p><b>burger.sh</b><span>/</span> restaurants <span>/</span> directory</p>
        <nav class="top-links" aria-label="Navigazione principale">
          <a href="/">presentazione</a>
          <a href="/auth">accedi</a>
          <a class="current" href="/restaurants">filiali</a>
        </nav>
        <div class="machine-state"><span class="pulse"></span> directory online</div>
      </header>

      <section class="identity-strip">
        <div class="brand-block">
          <span class="prompt">root@burger:~$</span>
          <h1>FILIALI<br><em>.SH</em></h1>
        </div>
        <div class="system-copy">
          <p class="eyebrow">restaurant directory / list</p>
          <p>Scegli una filiale per visualizzare il menu e ordinare.</p>
        </div>
        <div class="shift-stamp"><span>TOTAL</span><b>${pagination.total}</b><small>record found</small></div>
      </section>

      <div class="terminal-grid" style=${{ gridTemplateColumns: '1fr' }}>
        <section class="workspace" style=${{ gridColumn: '1 / -1' }}>
          <header class="workspace-head">
            <p id="breadcrumb">/ restaurants / directory</p>
            <p>page <b id="record-number">${pagination.page} / ${pagination.totalPages || 1}</b></p>
          </header>

          <${RestaurantSearch}
            filters=${filters}
            onFilterChange=${handleFilterChange}
            onSearch=${handleSearch}
            onClear=${handleClear}
            loading=${loading}
          />

          ${loading && html`<${Loading} message="CARICAMENTO FILIALI..." />`}

          ${error && html`
            <div class="alert alert-danger" style=${{ padding: '16px', border: '1px solid var(--alert)', background: 'rgba(240, 108, 69, 0.1)', color: 'var(--alert)', marginBottom: '16px' }}>
              <strong>Errore:</strong> ${error}
            </div>
          `}

          <div class="restaurant-grid" style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
            ${restaurants.map(restaurant => html`
              <${RestaurantCard}
                key=${restaurant.id}
                restaurant=${restaurant}
                onSelect=${onRestaurantSelect}
              />
            `)}
          </div>

          ${!loading && !restaurants.length && !error && html`
            <div style=${{ textAlign: 'center', padding: '48px', color: 'var(--dirty)' }}>
              <p><b>_</b> nessuna filiale trovata</p>
              <p class="eyebrow">prova a modificare i filtri di ricerca</p>
            </div>
          `}

          ${pagination.totalPages > 1 && html`
            <div class="pagination" style=${{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px', padding: '16px', borderTop: '1px solid var(--line)' }}>
              <${TerminalButton}
                onClick=${() => handlePageChange(pagination.page - 1)}
                disabled=${pagination.page <= 1}
              >
                [ ← ] prev
              <//>
              <span class="eyebrow" style=${{ margin: '0 16px' }}>
                pagina ${pagination.page} di ${pagination.totalPages}
              </span>
              <${TerminalButton}
                onClick=${() => handlePageChange(pagination.page + 1)}
                disabled=${pagination.page >= pagination.totalPages}
              >
                next [ → ]
              <//>
            </div>
          `}
        </section>
      </div>

      <footer class="footer-status">
        <span><b>F1</b> help</span>
        <span><b>↑ ↓</b> scroll</span>
        <span><b>enter</b> select</span>
        <span class="live-command">guest@burger:~$ <i></i></span>
      </footer>
    </main>
  `;
}

export default RestaurantListPage;