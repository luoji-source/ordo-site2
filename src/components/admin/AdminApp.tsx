import React, { useEffect, useMemo, useState } from 'react';

type Product = {
  id: string;
  slug: string;
  lang: 'zh' | 'en';
  name: string;
  status: 'active' | 'preview' | 'proven';
  version: string;
  batch: string;
  summary: string;
  body_md: string;
  price_text: string | null;
  cta_mode: 'email' | 'external' | 'none';
  is_published: number;
  sort_order: number;
};

type Update = {
  id: string;
  lang: 'zh' | 'en';
  title: string;
  date: string;
  product_id: string | null;
  version: string | null;
  batch: string | null;
  body_md: string;
  is_published: number;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  });
  const j = await res.json();
  if (!j?.ok) throw new Error(j?.error?.message || 'API error');
  return j.data as T;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: '8px 12px',
        border: '1px solid #1c2430',
        background: active ? 'rgba(110,231,183,0.08)' : '#0f1318',
        color: '#e8e8ea',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

export default function AdminApp() {
  const [tab, setTab] = useState<'products' | 'home' | 'updates' | 'media'>('products');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <TabButton active={tab === 'products'} onClick={() => setTab('products')}>Products</TabButton>
        <TabButton active={tab === 'home'} onClick={() => setTab('home')}>Home</TabButton>
        <TabButton active={tab === 'updates'} onClick={() => setTab('updates')}>Updates</TabButton>
        <TabButton active={tab === 'media'} onClick={() => setTab('media')}>Media</TabButton>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#a6a8ad' }}>Lang</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as any)} style={{ background: '#0f1318', color: '#e8e8ea', border: '1px solid #1c2430', borderRadius: 10, padding: '6px 10px' }}>
            <option value="zh">zh</option>
            <option value="en">en</option>
          </select>
        </div>
      </div>

      {tab === 'products' && <ProductsTab lang={lang} />}
      {tab === 'home' && <HomeTab lang={lang} />}
      {tab === 'updates' && <UpdatesTab lang={lang} />}
      {tab === 'media' && <MediaTab lang={lang} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: '#a6a8ad', fontSize: 12 }}>{label}</div>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        background: '#0f1318',
        color: '#e8e8ea',
        border: '1px solid #1c2430',
        borderRadius: 10,
        padding: '10px 12px'
      }}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        background: '#0f1318',
        color: '#e8e8ea',
        border: '1px solid #1c2430',
        borderRadius: 10,
        padding: '10px 12px',
        minHeight: 160
      }}
    />
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#11151b', border: '1px solid #1c2430', borderRadius: 14, padding: 16 }}>
      {children}
    </div>
  );
}

function ProductsTab({ lang }: { lang: 'zh' | 'en' }) {
  const [list, setList] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api<Product[]>(`/api/admin/products?lang=${lang}`);
      setList(data);
      if (selected) {
        const match = data.find((p) => p.id === selected.id) || null;
        setSelected(match);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const slug = `new-product-${Date.now()}`;
      const r = await api<{ id: string }>(`/api/admin/products`, {
        method: 'POST',
        body: JSON.stringify({
          lang,
          slug,
          name: 'New Product',
          status: 'preview',
          version: 'v1.0',
          batch: '2026-Q1',
          summary: '',
          body_md: '# Title\n\nWrite details here.',
          is_published: 0,
          sort_order: 100
        })
      });
      await load();
      const p = list.find((x) => x.id === r.id) || null;
      setSelected(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/admin/products/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...selected,
          is_published: Number(selected.is_published) ? 1 : 0
        })
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!selected) return;
    if (!confirm('Delete this product?')) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/admin/products/${selected.id}`, { method: 'DELETE' });
      setSelected(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Products</div>
          <button className="btn" onClick={create} disabled={busy} style={{ padding: '8px 10px' }}>+ New</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflow: 'auto' }}>
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                textAlign: 'left',
                borderRadius: 12,
                border: '1px solid #1c2430',
                padding: 10,
                background: selected?.id === p.id ? 'rgba(147,197,253,0.08)' : '#0f1318',
                color: '#e8e8ea',
                cursor: 'pointer'
              }}
            >
              <div style={{ color: '#a6a8ad', fontSize: 12 }}>{p.status} · {p.version} · {p.batch}</div>
              <div style={{ marginTop: 4 }}>{p.name}</div>
              <div style={{ color: '#a6a8ad', fontSize: 12, marginTop: 4 }}>{p.slug}</div>
            </button>
          ))}
        </div>
        {error && <div style={{ marginTop: 10, color: '#fca5a5' }}>{error}</div>}
      </Card>

      <Card>
        {!selected ? (
          <div style={{ color: '#a6a8ad' }}>Select a product to edit.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={save} disabled={busy} style={{ borderRadius: 999, padding: '10px 14px', border: '1px solid #1c2430', background: 'rgba(110,231,183,0.08)', color: '#e8e8ea', cursor: 'pointer' }}>Save</button>
              <button onClick={del} disabled={busy} style={{ borderRadius: 999, padding: '10px 14px', border: '1px solid #1c2430', background: '#0f1318', color: '#e8e8ea', cursor: 'pointer' }}>Delete</button>
              <a href={`/${lang}/products/${selected.slug}`} target="_blank" rel="noreferrer" style={{ borderRadius: 999, padding: '10px 14px', border: '1px solid #1c2430', background: '#0f1318', color: '#e8e8ea', textDecoration: 'none' }}>Preview</a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Name"><Input value={selected.name} onChange={(e) => setSelected({ ...selected, name: e.target.value })} /></Field>
              <Field label="Slug"><Input value={selected.slug} onChange={(e) => setSelected({ ...selected, slug: e.target.value })} /></Field>
              <Field label="Status">
                <select value={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value as any })} style={{ background: '#0f1318', color: '#e8e8ea', border: '1px solid #1c2430', borderRadius: 10, padding: '10px 12px' }}>
                  <option value="active">active</option>
                  <option value="preview">preview</option>
                  <option value="proven">proven</option>
                </select>
              </Field>
              <Field label="Published">
                <select value={Number(selected.is_published)} onChange={(e) => setSelected({ ...selected, is_published: Number(e.target.value) })} style={{ background: '#0f1318', color: '#e8e8ea', border: '1px solid #1c2430', borderRadius: 10, padding: '10px 12px' }}>
                  <option value={0}>0 (hidden)</option>
                  <option value={1}>1 (visible)</option>
                </select>
              </Field>
              <Field label="Version"><Input value={selected.version} onChange={(e) => setSelected({ ...selected, version: e.target.value })} /></Field>
              <Field label="Batch"><Input value={selected.batch} onChange={(e) => setSelected({ ...selected, batch: e.target.value })} /></Field>
              <Field label="Sort Order"><Input type="number" value={selected.sort_order} onChange={(e) => setSelected({ ...selected, sort_order: Number(e.target.value) })} /></Field>
              <Field label="Price Text"><Input value={selected.price_text ?? ''} onChange={(e) => setSelected({ ...selected, price_text: e.target.value })} /></Field>
            </div>

            <Field label="Summary"><Textarea value={selected.summary} onChange={(e) => setSelected({ ...selected, summary: e.target.value })} /></Field>
            <Field label="Body (Markdown)"><Textarea value={selected.body_md} onChange={(e) => setSelected({ ...selected, body_md: e.target.value })} /></Field>

            {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
          </div>
        )}
      </Card>
    </div>
  );
}

function HomeTab({ lang }: { lang: 'zh' | 'en' }) {
  const [text, setText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const row = await api<any>(`/api/admin/pages/home?lang=${lang}`);
      setText(row.content_json || '{}');
    } catch (e: any) {
      // if page doesn't exist yet, start from template
      setText(JSON.stringify({
        hero: {
          kicker: 'ORDO',
          title: lang === 'zh' ? '四枚状态标记器（不是书签）' : 'Four markers (not a bookmark)',
          subtitle: lang === 'zh' ? '用于回到同一段阅读节奏。' : 'Return to the same reading rhythm.',
          primaryCtaLabel: lang === 'zh' ? '邮件下单' : 'Email to order',
          primaryCtaHref: 'mailto:hello@ordo.example?subject=Order',
          secondaryCtaLabel: lang === 'zh' ? '查看产品' : 'View products',
          secondaryCtaHref: lang === 'zh' ? '/zh/products' : '/en/products'
        }
      }, null, 2));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      // validate json
      JSON.parse(text);
      await api(`/api/admin/pages/home?lang=${lang}`, {
        method: 'PUT',
        body: JSON.stringify({ content_json: text })
      });
      alert('Saved');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>Home page JSON (module config)</div>
        <button onClick={save} disabled={busy} style={{ borderRadius: 999, padding: '10px 14px', border: '1px solid #1c2430', background: 'rgba(110,231,183,0.08)', color: '#e8e8ea', cursor: 'pointer' }}>Save</button>
      </div>
      <div style={{ marginTop: 10 }}>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', minHeight: 360 }} />
      </div>
      {error && <div style={{ marginTop: 8, color: '#fca5a5' }}>{error}</div>}
      <div style={{ marginTop: 10, color: '#a6a8ad', fontSize: 12 }}>
        Tip: keep this JSON small & factual. The frontend renders fields like hero.title / hero.subtitle.
      </div>
    </Card>
  );
}

function UpdatesTab({ lang }: { lang: 'zh' | 'en' }) {
  const [list, setList] = useState<Update[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Update | null>(null);
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const [u, p] = await Promise.all([
        api<Update[]>(`/api/admin/updates?lang=${lang}`),
        api<Product[]>(`/api/admin/products?lang=${lang}`)
      ]);
      setList(u);
      setProducts(p);
      if (selected) {
        const match = u.find((x) => x.id === selected.id) || null;
        setSelected(match);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ id: string }>(`/api/admin/updates`, {
        method: 'POST',
        body: JSON.stringify({
          lang,
          title: lang === 'zh' ? '新更新' : 'New update',
          date: new Date().toISOString().slice(0, 10),
          body_md: '- item',
          is_published: 0
        })
      });
      await load();
      const match = list.find((x) => x.id === r.id) || null;
      setSelected(match);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/admin/updates/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...selected, is_published: Number(selected.is_published) ? 1 : 0 })
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!selected) return;
    if (!confirm('Delete this update?')) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/admin/updates/${selected.id}`, { method: 'DELETE' });
      setSelected(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const productOptions = useMemo(() => [{ id: '', name: '(none)' }, ...products.map((p) => ({ id: p.id, name: p.name }))], [products]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Updates</div>
          <button onClick={create} disabled={busy} style={{ padding: '8px 10px', borderRadius: 999, border: '1px solid #1c2430', background: '#0f1318', color: '#e8e8ea', cursor: 'pointer' }}>+ New</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflow: 'auto' }}>
          {list.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              style={{
                textAlign: 'left',
                borderRadius: 12,
                border: '1px solid #1c2430',
                padding: 10,
                background: selected?.id === u.id ? 'rgba(147,197,253,0.08)' : '#0f1318',
                color: '#e8e8ea',
                cursor: 'pointer'
              }}
            >
              <div style={{ color: '#a6a8ad', fontSize: 12 }}>{u.date} · {Number(u.is_published) ? 'published' : 'hidden'}</div>
              <div style={{ marginTop: 4 }}>{u.title}</div>
            </button>
          ))}
        </div>
        {error && <div style={{ marginTop: 10, color: '#fca5a5' }}>{error}</div>}
      </Card>

      <Card>
        {!selected ? (
          <div style={{ color: '#a6a8ad' }}>Select an update to edit.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={save} disabled={busy} style={{ borderRadius: 999, padding: '10px 14px', border: '1px solid #1c2430', background: 'rgba(110,231,183,0.08)', color: '#e8e8ea', cursor: 'pointer' }}>Save</button>
              <button onClick={del} disabled={busy} style={{ borderRadius: 999, padding: '10px 14px', border: '1px solid #1c2430', background: '#0f1318', color: '#e8e8ea', cursor: 'pointer' }}>Delete</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Title"><Input value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} /></Field>
              <Field label="Date"><Input value={selected.date} onChange={(e) => setSelected({ ...selected, date: e.target.value })} /></Field>
              <Field label="Published">
                <select value={Number(selected.is_published)} onChange={(e) => setSelected({ ...selected, is_published: Number(e.target.value) })} style={{ background: '#0f1318', color: '#e8e8ea', border: '1px solid #1c2430', borderRadius: 10, padding: '10px 12px' }}>
                  <option value={0}>0 (hidden)</option>
                  <option value={1}>1 (visible)</option>
                </select>
              </Field>
              <Field label="Product (optional)">
                <select value={selected.product_id || ''} onChange={(e) => setSelected({ ...selected, product_id: e.target.value || null })} style={{ background: '#0f1318', color: '#e8e8ea', border: '1px solid #1c2430', borderRadius: 10, padding: '10px 12px' }}>
                  {productOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Version"><Input value={selected.version ?? ''} onChange={(e) => setSelected({ ...selected, version: e.target.value || null })} /></Field>
              <Field label="Batch"><Input value={selected.batch ?? ''} onChange={(e) => setSelected({ ...selected, batch: e.target.value || null })} /></Field>
            </div>

            <Field label="Body (Markdown)"><Textarea value={selected.body_md} onChange={(e) => setSelected({ ...selected, body_md: e.target.value })} /></Field>

            {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
          </div>
        )}
      </Card>
    </div>
  );
}

function MediaTab({ lang }: { lang: 'zh' | 'en' }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Product[]>(`/api/admin/products?lang=${lang}`)
      .then((p) => setProducts(p))
      .catch((e) => setError(e.message));
  }, [lang]);

  const upload = async () => {
    setBusy(true);
    setError('');
    setResult('');
    try {
      if (!file) throw new Error('Select a file');
      const form = new FormData();
      form.append('file', file);
      if (productId) form.append('productId', productId);
      if (alt) form.append('alt', alt);
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error?.message || 'Upload failed');
      setResult(j.data.publicUrl);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>Upload media to R2 (and optionally attach to a product)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Attach to product (optional)">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} style={{ background: '#0f1318', color: '#e8e8ea', border: '1px solid #1c2430', borderRadius: 10, padding: '10px 12px' }}>
            <option value="">(none)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Alt">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
        </Field>
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={upload} disabled={busy} style={{ borderRadius: 999, padding: '10px 14px', border: '1px solid #1c2430', background: 'rgba(110,231,183,0.08)', color: '#e8e8ea', cursor: 'pointer' }}>Upload</button>
      </div>

      {result && (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: '#a6a8ad', fontSize: 12 }}>Public URL</div>
          <div style={{ marginTop: 6 }}><a href={result} target="_blank" rel="noreferrer">{result}</a></div>
        </div>
      )}
      {error && <div style={{ marginTop: 10, color: '#fca5a5' }}>{error}</div>}
    </Card>
  );
}
