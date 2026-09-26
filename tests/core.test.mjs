import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceKm, REFERENCE, freshness, filterItems, readSaved, writeSaved, safeSourceUrl } from '../src/core.js';
import { createDemoItems } from '../src/data.js';

const now=Date.parse('2026-09-26T08:00:00Z');
const data=createDemoItems(now);
test('distance uses a fixed reference and correct kilometre scale', () => {
  assert.equal(distanceKm(REFERENCE),0);
  assert.ok(Math.abs(distanceKm({latitude:0,longitude:0},{latitude:0,longitude:1})-111.195)<0.01);
});
test('category and radius filters combine, and increasing radius includes more actual locations', () => {
  const small=filterItems(data,'all',1), regular=filterItems(data,'all',10), large=filterItems(data,'all',30);
  assert.ok(small.length<regular.length); assert.ok(regular.length<large.length); assert.equal(large.length,60);
  const electronics=filterItems(data,'electronics',10);
  assert.ok(electronics.length>0); assert.ok(electronics.every(x=>x.category==='electronics' && distanceKm(x)<=10));
});
test('freshness includes boundaries and handles missing dates without claiming availability', () => {
  const at=hours=>new Date(now-hours*3600000).toISOString();
  assert.equal(freshness(at(2),now),'fresh'); assert.equal(freshness(at(2.01),now),'recent');
  assert.equal(freshness(at(12),now),'recent'); assert.equal(freshness(at(12.01),now),'stale');
  assert.equal(freshness(at(48),now),'stale'); assert.equal(freshness(at(48.01),now),'old');
  assert.equal(freshness('invalid',now),'old');
});
test('stash reloads unique existing IDs and recovers from corrupt or blocked storage', () => {
  const ids=new Set(data.map(x=>x.id)); let value='["furniture-0","furniture-0","gone",42]';
  const storage={getItem:()=>value,setItem:(_,v)=>{value=v;}};
  assert.deepEqual([...readSaved(storage,ids)],['furniture-0']);
  assert.equal(writeSaved(storage,new Set(['electronics-0'])),true);
  assert.deepEqual([...readSaved(storage,ids)],['electronics-0']);
  value='{broken'; assert.equal(readSaved(storage,ids).size,0);
  const blocked={getItem:()=>{throw Error();},setItem:()=>{throw Error();}};
  assert.equal(readSaved(blocked,ids).size,0); assert.equal(writeSaved(blocked,new Set()),false);
});
test('demo data is honest and source navigation cannot use executable URLs', () => {
  assert.equal(new Set(data.map(x=>x.id)).size,60);
  assert.ok(data.every(x=>x.isDemo && x.sourceUrl===null && x.availability==='unknown'));
  assert.equal(safeSourceUrl('javascript:alert(1)'),null); assert.equal(safeSourceUrl(null),null);
  assert.equal(safeSourceUrl('https://example.com/post'),'https://example.com/post');
});
