import { CATEGORIES, REFERENCE, distanceKm, filterItems, freshness, timeAgo, escapeHtml as esc, readSaved, writeSaved, safeSourceUrl } from './core.js';
import { createDemoItems } from './data.js';
import { icon, hydrateIcons } from './icons.js';

const $ = selector => document.querySelector(selector);
hydrateIcons();
let storage;
try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
let anchor = Date.now();
try {
  const persisted = Number(storage.getItem('freemap.demo-anchor.v1'));
  if (persisted > 0 && persisted <= Date.now()) anchor = persisted;
  else storage.setItem('freemap.demo-anchor.v1', String(anchor));
} catch { /* Demo works without browser storage. */ }
const items = createDemoItems(anchor);
const byId = new Map(items.map(item => [item.id, item]));
const saved = readSaved(storage, new Set(byId.keys()));
let category = 'all', radius = 10, selectedId = null;
let activeItems = [], markers = new Map(), toastTimer;
let map, tiles, markerLayer, radiusLayer;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#categories').innerHTML = CATEGORIES.map(c => `<button class="category ${c.id === 'all' ? 'active' : ''}" data-category="${c.id}" aria-pressed="${c.id === 'all'}">${icon(c.icon)}<span>${c.label}</span></button>`).join('');

function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 2800);
}
function art(item) { return `<div class="placeholder-art" role="img" aria-label="${esc(item.category)} illustration, no item photo">${icon(item.category)}<span>NO PHOTO AVAILABLE</span></div>`; }
function photo(item) { return item.imageUrl ? `<img src="${esc(item.imageUrl)}" alt="Illustrative photo for ${esc(item.title)}" data-item-image="${item.id}" />` : art(item); }
document.addEventListener('error', event => {
  const el = event.target;
  if (el instanceof HTMLImageElement && el.dataset.itemImage) el.outerHTML = art(byId.get(el.dataset.itemImage));
}, true);
function markerIcon(item) {
  return L.divIcon({ className: `find-marker ${freshness(item.postedAt)} ${selectedId === item.id ? 'selected' : ''}`, html: `<span class="pin-orb">${icon(item.category)}${saved.has(item.id) ? `<span class="saved-dot">${icon('heart')}</span>` : ''}</span>`, iconSize: [38,38], iconAnchor: [19,19], tooltipAnchor:[0,20] });
}
function syncPanelState() { $('#workspace').classList.toggle('panel-open', !$('#detail').hidden || !$('#stash-panel').hidden); }
function updateMarkers() {
  if (!map) return;
  markerLayer.clearLayers();
  markers = new Map();
  for (const item of activeItems) {
    const marker = L.marker([item.latitude,item.longitude], { icon: markerIcon(item), keyboard:true, title:item.title, alt: `View ${item.title}`, riseOnHover:true, zIndexOffset: selectedId === item.id ? 1500 : freshness(item.postedAt) === 'fresh' ? 300 : 0 });
    marker.bindTooltip(`${esc(item.title)} <span>· ${timeAgo(item.postedAt)}</span>`, { direction:'bottom', className:'find-tooltip', offset:[0,4] });
    marker.on('click', () => openDetail(item.id));
    marker.addTo(markerLayer);
    const el = marker.getElement();
    el.setAttribute('aria-label', `View ${item.title}`);
    el.setAttribute('aria-haspopup', 'dialog');
    el.dataset.itemId = item.id;
    el.dataset.category = item.category;
    el.addEventListener('keydown', event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); openDetail(item.id); } });
    markers.set(item.id, marker);
  }
  updateVisibleCount();
}
function updateVisibleCount() {
  const visible = map ? activeItems.filter(item => map.getBounds().contains([item.latitude,item.longitude])).length : activeItems.length;
  $('#visible-count').textContent = visible;
  $('#empty-map').hidden = visible > 0 || !$('#detail').hidden || !$('#stash-panel').hidden;
  $('#category-description').textContent = category === 'all' ? 'A little exploring goes a long way.' : `${CATEGORIES.find(c => c.id === category).label}, with a second life ahead.`;
  if (map) {
    $('#zoom-in').disabled = map.getZoom() >= map.getMaxZoom();
    $('#zoom-out').disabled = map.getZoom() <= map.getMinZoom();
  }
}
function applyFilters() {
  activeItems = filterItems(items,category,radius);
  if (selectedId && !activeItems.some(item => item.id === selectedId)) closeDetail(false);
  document.querySelectorAll('[data-category].category').forEach(button => {
    const active = button.dataset.category === category;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#radius').value = radius;
  $('#radius-value').innerHTML = `${radius} <span>km</span>`;
  $('#radius').style.background = `linear-gradient(to right,#eac76c ${(radius-1)/29*100}%,#34404b ${(radius-1)/29*100}%)`;
  radiusLayer?.setRadius(radius*1000);
  updateMarkers();
}
function closeDetail(restoreFocus = true) {
  const previousId = selectedId;
  selectedId = null;
  $('#detail').hidden = true;
  if (previousId && markers.has(previousId)) {
    markers.get(previousId).getElement()?.classList.remove('selected');
    markers.get(previousId).setZIndexOffset(freshness(byId.get(previousId).postedAt) === 'fresh' ? 300 : 0);
  }
  syncPanelState();
  if (restoreFocus) (markers.get(previousId)?.getElement() || $('#categories button')).focus({preventScroll:true});
  updateVisibleCount();
}
function renderDetail(item) {
  const source = safeSourceUrl(item.sourceUrl);
  $('#detail').innerHTML = `<div class="detail-image">${photo(item)}<span class="photo-shade"></span><span class="free-label">FREE</span><div class="photo-actions"><button class="icon-button" id="close-detail" aria-label="Close item details">${icon('close')}</button><button class="icon-button save-button ${saved.has(item.id) ? 'is-saved' : ''}" id="save-item" aria-label="${saved.has(item.id) ? 'Remove from' : 'Save to'} stash" aria-pressed="${saved.has(item.id)}">${icon('heart')}</button></div></div>
  <div class="detail-content"><div class="detail-meta"><span class="detail-category">${esc(item.category)} / A SECOND LIFE</span><span class="detail-demo">DEMO FIND</span></div><h2 id="detail-title">${esc(item.title)}</h2><p class="detail-time">${icon('clock')}<strong>Posted ${timeAgo(item.postedAt)}</strong><span>· Availability unknown</span></p><p class="detail-location">${icon('pin')}<span>${esc(item.locationLabel)} · ${distanceKm(item).toFixed(1)} km from City Hall</span></p><p class="detail-description">${esc(item.description)}</p>
  ${source && !item.isDemo ? `<a class="primary" href="${esc(source)}" target="_blank" rel="noopener noreferrer">View original post ${icon('arrow')}</a>` : `<button class="primary source-disabled" disabled>${icon('lock')}Demo listing · no original post</button>`}<p class="source-note">${item.isDemo ? 'Illustrative listing and approximate location. Not available to claim.' : 'Opens the original post. Availability is confirmed by the owner.'}</p></div>`;
  $('#close-detail').addEventListener('click', () => closeDetail());
  $('#save-item').addEventListener('click', () => { toggleSaved(item.id); $('#save-item').focus({preventScroll:true}); });
}
function openDetail(id, fromStash = false) {
  const item = byId.get(id);
  if (!item) return;
  closeStash(false);
  if (fromStash) {
    category = 'all'; radius = Math.max(radius,Math.min(30,Math.ceil(distanceKm(item))));
    applyFilters();
    map?.setView([item.latitude,item.longitude],Math.max(13,map.getZoom()),{animate:!reduceMotion});
  }
  if (selectedId && markers.has(selectedId)) markers.get(selectedId).getElement()?.classList.remove('selected');
  selectedId = id;
  renderDetail(item);
  $('#detail').hidden = false;
  markers.get(id)?.getElement()?.classList.add('selected');
  markers.get(id)?.setZIndexOffset(1500);
  syncPanelState(); updateVisibleCount();
  $('#close-detail').focus({preventScroll:true});
}
function toggleSaved(id) {
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  const persisted = writeSaved(storage,saved);
  renderStash();
  const marker = markers.get(id);
  if (marker) {
    // Keep the marker DOM and keyboard event handlers intact.
    const orb = marker.getElement()?.querySelector('.pin-orb');
    if (orb) { orb.querySelector('.saved-dot')?.remove(); if (saved.has(id)) orb.insertAdjacentHTML('beforeend', `<span class="saved-dot">${icon('heart')}</span>`); }
  }
  if (selectedId === id) renderDetail(byId.get(id));
  notify(persisted ? saved.has(id) ? 'A good find, saved to your stash.' : 'Removed from your stash.' : 'Saved for this visit only — browser storage is unavailable.');
}
function renderStash() {
  $('#stash-count').textContent = saved.size;
  $('#stash-panel-count').textContent = saved.size;
  const entries = [...saved].map(id => byId.get(id)).filter(Boolean).reverse();
  $('#stash-list').innerHTML = entries.length ? entries.map(item => `<article class="stash-row"><button class="stash-row-open" data-open-saved="${item.id}" aria-label="View saved ${esc(item.title)}"><span class="stash-thumb">${photo(item)}</span><span class="stash-row-copy"><strong>${esc(item.title)}</strong><span>${esc(item.locationLabel)} · ${timeAgo(item.postedAt)}</span></span></button><button class="icon-button" data-remove-saved="${item.id}" aria-label="Remove ${esc(item.title)} from stash">${icon('close')}</button></article>`).join('') : `<div class="stash-empty">${icon('heart')}<h3>Your next favourite is out there.</h3><p>Tap the heart on a find to keep it here.<br />A little collection, just for you.</p><button id="explore-from-stash">Back to exploring ${icon('arrow')}</button></div>`;
  $('#explore-from-stash')?.addEventListener('click', () => closeStash());
}
function closeStash(restoreFocus = true) {
  $('#stash-panel').hidden = true;
  $('#stash-toggle').setAttribute('aria-expanded','false');
  syncPanelState();
  if (restoreFocus) $('#stash-toggle').focus({preventScroll:true});
  updateVisibleCount();
}
function openStash() {
  closeDetail(false);
  renderStash();
  $('#stash-panel').hidden = false;
  $('#stash-toggle').setAttribute('aria-expanded','true');
  syncPanelState(); updateVisibleCount();
  $('#close-stash').focus({preventScroll:true});
}
function returnHome() {
  if (!map) return;
  map.setView([1.327,103.841],window.innerWidth<=600 ? 12 : 12.5,{animate:!reduceMotion});
}
function resetFilters() { category='all'; radius=10; applyFilters(); returnHome(); }

$('#categories').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (button) { category = button.dataset.category; applyFilters(); } });
$('#radius').addEventListener('input', event => {
  const value = Number(event.target.value);
  $('#radius-value').innerHTML = `${value} <span>km</span>`;
  event.target.style.background = `linear-gradient(to right,#eac76c ${(value-1)/29*100}%,#34404b ${(value-1)/29*100}%)`;
});
$('#radius').addEventListener('change', event => { radius=Number(event.target.value); applyFilters(); });
$('#stash-toggle').addEventListener('click', () => $('#stash-panel').hidden ? openStash() : closeStash());
$('#close-stash').addEventListener('click', () => closeStash());
$('#stash-list').addEventListener('click', event => {
  const open = event.target.closest('[data-open-saved]'), remove=event.target.closest('[data-remove-saved]');
  if (open) openDetail(open.dataset.openSaved,true);
  if (remove) { toggleSaved(remove.dataset.removeSaved); ($('#stash-list [data-remove-saved]') || $('#explore-from-stash') || $('#close-stash')).focus({preventScroll:true}); }
});
$('#recenter').addEventListener('click',returnHome);
$('#zoom-in').addEventListener('click', () => map?.zoomIn());
$('#zoom-out').addEventListener('click', () => map?.zoomOut());
$('#reset-filters').addEventListener('click',resetFilters);
$('#demo-info').addEventListener('click', () => $('#about-dialog').showModal());
$('#close-about').addEventListener('click', () => $('#about-dialog').close());
$('#start-exploring').addEventListener('click', () => $('#about-dialog').close());
$('#about-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) { const rect=event.target.getBoundingClientRect(); if (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) event.target.close(); } });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || $('#about-dialog').open) return;
  if (!$('#stash-panel').hidden) closeStash(); else if (!$('#detail').hidden) closeDetail();
});

function initMap() {
  if (!window.L) {
    $('#map-error').hidden = false;
    $('#map-error strong').textContent = 'The map library couldn’t load';
    $('#map-error p').textContent = 'Reload to try again. The local Leaflet files are required.';
    $('#retry-map').onclick = () => location.reload();
    return;
  }
  map = L.map('map',{zoomControl:false,zoomSnap:.5,zoomDelta:.5,minZoom:10,maxZoom:18,scrollWheelZoom:true,inertia:!reduceMotion,preferCanvas:true,zoomAnimation:!reduceMotion,fadeAnimation:!reduceMotion});
  map.attributionControl.setPrefix(false);
  let failed=0, loaded=0;
  tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',maxZoom:19,crossOrigin:true});
  tiles.on('loading', () => { failed=0; loaded=0; });
  tiles.on('tileload', () => { loaded++; });
  tiles.on('tileerror', () => { failed++; $('#map-error').hidden=false; });
  tiles.on('load', () => {
    $('#map-error').hidden=failed === 0;
    $('#map-error strong').textContent = loaded ? 'Some map tiles couldn’t load' : 'Map tiles couldn’t load';
  });
  tiles.addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  radiusLayer = L.circle([REFERENCE.latitude,REFERENCE.longitude],{radius:radius*1000,color:'#b3c8c0',weight:1,opacity:.2,dashArray:'4 8',fillColor:'#c5d8c8',fillOpacity:.015,interactive:false}).addTo(map);
  L.marker([REFERENCE.latitude,REFERENCE.longitude],{icon:L.divIcon({className:'reference-label',iconSize:[12,12],iconAnchor:[6,6]}),interactive:false}).addTo(map).bindTooltip('CITY HALL · REFERENCE CENTRE',{permanent:true,direction:'bottom',className:'find-tooltip reference-tooltip',offset:[0,8]});
  returnHome();
  map.on('moveend zoomend',updateVisibleCount);
  map.on('click', () => { if (!$('#detail').hidden) closeDetail(false); });
  $('#retry-map').onclick = () => { $('#map-error').hidden=true; tiles.redraw(); };
  new ResizeObserver(() => { map.invalidateSize({pan:false}); updateVisibleCount(); }).observe($('#workspace'));
}

initMap();
applyFilters();
renderStash();
setInterval(() => {
  for (const item of activeItems) {
    const marker=markers.get(item.id), el=marker?.getElement();
    if (!el) continue;
    el.classList.remove('fresh','recent','stale','old'); el.classList.add(freshness(item.postedAt));
    marker.setTooltipContent(`${esc(item.title)} <span>· ${timeAgo(item.postedAt)}</span>`);
  }
  if (selectedId) { const label=$('#detail .detail-time strong'); if (label) label.textContent=`Posted ${timeAgo(byId.get(selectedId).postedAt)}`; }
},60000);
