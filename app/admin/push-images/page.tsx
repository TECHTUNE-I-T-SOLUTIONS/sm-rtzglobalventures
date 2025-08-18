"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

type ImgItem = { id?: string; name: string; path?: string; url: string }

export default function ManageImagesPage() {
  const [pushImages, setPushImages] = useState<ImgItem[]>([])
  const [productImages, setProductImages] = useState<ImgItem[]>([])
  const [ebookImages, setEbookImages] = useState<ImgItem[]>([])
  const [postImages, setPostImages] = useState<ImgItem[]>([])
  const [loading, setLoading] = useState(false)
  const [perPage, setPerPage] = useState<number>(12)
  const [page, setPage] = useState<number>(1)

  // try to extract bucket and path from a Supabase public URL
  function parsePublicUrl(url: string) {
    try {
      const m = url.match(/\/object\/public\/([^\/]+)\/(.+)$/)
      if (!m) return null
      return { bucket: m[1], path: decodeURIComponent(m[2]) }
    } catch (e) {
      return null
    }
  }

  async function listPushImages() {
    try {
      const { data, error } = await supabase.storage.from('push-images').list('public/push-images', { limit: 500 })
      if (error) throw error
      const items = (data || []).map((f:any) => {
        const path = `public/push-images/${f.name}`
        const { data: urlData } = supabase.storage.from('push-images').getPublicUrl(path)
        return { name: f.name, path, url: urlData.publicUrl }
      })
      return items.reverse() as ImgItem[]
    } catch (e) {
      console.error('list push-images failed', e)
      return []
    }
  }

  async function listFromTable(table: string, cols: string[]) {
    try {
      const { data, error } = await supabase.from(table).select(cols.join(','))
      if (error) throw error
      // map depending on column names
      return (data || []).flatMap((r:any) => {
        const results: ImgItem[] = []
        // image_url/cover_image_url/file_url can be full public URLs or storage paths
        const pushToResults = (fieldVal: string|undefined, suggestedName: string|undefined) => {
          if (!fieldVal) return
          // if looks like a full URL, use directly
          if (fieldVal.startsWith('http://') || fieldVal.startsWith('https://')) {
            results.push({ id: r.id, name: suggestedName || String(r.id), url: fieldVal })
            return
          }
          // otherwise assume it's a storage path like `public/...` or `path/to/file.jpg`
          // attempt to resolve via bucket heuristics for each table
          const bucketMap: Record<string,string> = {
            products: 'files',
            ebooks: 'ebook_files',
            posts: 'posts',
            profiles: 'avatars'
          }
          const bucket = bucketMap[table]
          if (!bucket) return
          try {
            const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fieldVal as string)
            if (pub?.publicUrl) results.push({ id: r.id, name: suggestedName || String(r.id), url: pub.publicUrl })
          } catch (e) {
            console.error('getPublicUrl failed', e)
          }
        }

        pushToResults(r.image_url, r.name || r.title)
        pushToResults(r.cover_image_url, r.title)
        // treat file_url only if it looks like an image
        if (r.file_url && (String(r.file_url).endsWith('.jpg') || String(r.file_url).endsWith('.png') || String(r.file_url).endsWith('.webp'))) {
          pushToResults(r.file_url, r.title)
        }
        return results
      })
    } catch (e) {
      console.error(`list ${table} failed`, e)
      toast.error(`Failed to load ${table} images`)
      return []
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    const [push, products, ebooks, posts] = await Promise.all([
      listPushImages(),
      listFromTable('products', ['id', 'name', 'image_url']),
      listFromTable('ebooks', ['id', 'title', 'cover_image_url', 'file_url']),
      listFromTable('posts', ['id', 'title', 'image_url']),
    ])
    setPushImages(push)
    setProductImages(products)
    setEbookImages(ebooks)
    setPostImages(posts)
    setLoading(false)
  }

  useEffect(()=>{ fetchAll() }, [])

  const deleteStorageObject = async (bucket: string, path: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch('/api/push/uploads/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ path, bucket })
    })
    return res.json()
  }

  const handleDeleteDbImage = async (table: string, id: string|undefined, field: string, url: string, onSuccess: ()=>void) => {
    if (!confirm('Delete this image?')) return
    try {
      // try to remove storage object if we can parse bucket/path from url
      const parsed = parsePublicUrl(url)
      if (parsed) {
        await deleteStorageObject(parsed.bucket, parsed.path)
      }
      // if DB stored a storage path (not public URL) try to delete using heuristics
      if (!parsed && id) {
        // fetch the record to inspect raw value
        const { data } = await supabase.from(table).select(field).eq('id', id).single()
  const raw = (data as any)?.[field]
        if (raw && typeof raw === 'string' && !raw.startsWith('http')) {
          const bucketMap: Record<string,string> = { products: 'files', ebooks: 'ebook_files', posts: 'posts', profiles: 'avatars' }
          const bucket = bucketMap[table]
          if (bucket) await deleteStorageObject(bucket, raw)
        }
      }
      // clear DB field
      if (id) {
        const upd: any = {}
        upd[field] = null
        const { error } = await supabase.from(table).update(upd).eq('id', id)
        if (error) throw error
      }
      onSuccess()
      toast.success('Image deleted')
    } catch (e) {
      console.error('delete failed', e)
      toast.error('Delete failed')
    }
  }

  const handleDeletePushImage = async (path: string, onSuccess: ()=>void) => {
    if (!confirm('Delete this image?')) return
    try {
      const { ok } = await deleteStorageObject('push-images', path)
      if (!ok) throw new Error('delete failed')
      onSuccess()
      toast.success('Image deleted')
    } catch (e) {
      console.error('delete failed', e)
      toast.error('Delete failed')
    }
  }

  const renderGrid = (items: ImgItem[], options: { bucket?: string, table?: string, field?: string, onDeleteSuccess: (idOrPath:string)=>void }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
      {items.map(it => (
        <div key={`${options.bucket || options.table}:${it.id || it.url}`} className="border rounded p-2 flex flex-col">
          <img src={it.url} alt={it.name} className="w-full h-28 object-cover rounded" />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs truncate">{it.name}</div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={()=>navigator.clipboard.writeText(it.url)}>Copy</Button>
              {options.table ? (
                <Button size="sm" variant="destructive" onClick={()=>handleDeleteDbImage(options.table!, it.id, options.field || 'image_url', it.url, ()=>options.onDeleteSuccess(String(it.id)))}>Delete</Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={()=>handleDeletePushImage(it.path || '', ()=>options.onDeleteSuccess(it.path || ''))}>Delete</Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Manage Images</h2>
        <p className="text-sm text-muted-foreground">Manage images used across pushes, products, e-books and posts.</p>
      </div>

      <div>
        <h3 className="font-medium">Push Images</h3>
        <p className="text-sm text-muted-foreground">Images specifically uploaded for push notifications (bucket: push-images)</p>
        {loading && <div className="text-sm">Loading…</div>}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">Showing {pushImages.length === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, pushImages.length)} of {pushImages.length}</div>
          <div className="flex items-center gap-2">
            <select aria-label="Items per page" value={perPage} onChange={(e)=>{ setPerPage(Number(e.target.value)); setPage(1) }} className="px-2 py-1 border rounded bg-white dark:bg-black text-sm">
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
            </select>
            <Button size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</Button>
            <Button size="sm" onClick={()=>setPage(p=>Math.min(Math.max(1, Math.ceil(pushImages.length / perPage)), p+1))} disabled={page===Math.max(1, Math.ceil(pushImages.length / perPage))}>Next</Button>
          </div>
        </div>
        {renderGrid(pushImages.slice((page - 1) * perPage, page * perPage), { bucket: 'push-images', onDeleteSuccess: (path)=>setPushImages(prev=>prev.filter(i=>i.path!==path)) })}
      </div>

      <div>
        <h3 className="font-medium">Product Images</h3>
        <p className="text-sm text-muted-foreground">Product and service images (table: products)</p>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">Showing {productImages.length === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, productImages.length)} of {productImages.length}</div>
          <div className="flex items-center gap-2">
            <select aria-label="Items per page" value={perPage} onChange={(e)=>{ setPerPage(Number(e.target.value)); setPage(1) }} className="px-2 py-1 border rounded bg-white dark:bg-black text-sm">
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
            </select>
            <Button size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</Button>
            <Button size="sm" onClick={()=>setPage(p=>Math.min(Math.max(1, Math.ceil(productImages.length / perPage)), p+1))} disabled={page===Math.max(1, Math.ceil(productImages.length / perPage))}>Next</Button>
          </div>
        </div>
        {renderGrid(productImages.slice((page - 1) * perPage, page * perPage), { table: 'products', field: 'image_url', onDeleteSuccess: (id)=>setProductImages(prev=>prev.filter(i=>String(i.id)!==String(id))) })}
      </div>

      <div>
        <h3 className="font-medium">E-book Images</h3>
        <p className="text-sm text-muted-foreground">E-book thumbnail/cover images (table: ebooks)</p>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">Showing {ebookImages.length === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, ebookImages.length)} of {ebookImages.length}</div>
          <div className="flex items-center gap-2">
            <select aria-label="Items per page" value={perPage} onChange={(e)=>{ setPerPage(Number(e.target.value)); setPage(1) }} className="px-2 py-1 border rounded bg-white dark:bg-black text-sm">
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
            </select>
            <Button size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</Button>
            <Button size="sm" onClick={()=>setPage(p=>Math.min(Math.max(1, Math.ceil(ebookImages.length / perPage)), p+1))} disabled={page===Math.max(1, Math.ceil(ebookImages.length / perPage))}>Next</Button>
          </div>
        </div>
        {renderGrid(ebookImages.slice((page - 1) * perPage, page * perPage), { table: 'ebooks', field: 'cover_image_url', onDeleteSuccess: (id)=>setEbookImages(prev=>prev.filter(i=>String(i.id)!==String(id))) })}
      </div>

      <div>
        <h3 className="font-medium">Post Images</h3>
        <p className="text-sm text-muted-foreground">Images uploaded with posts (table: posts)</p>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">Showing {postImages.length === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, postImages.length)} of {postImages.length}</div>
          <div className="flex items-center gap-2">
            <select aria-label="Items per page" value={perPage} onChange={(e)=>{ setPerPage(Number(e.target.value)); setPage(1) }} className="px-2 py-1 border rounded bg-white dark:bg-black text-sm">
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
            </select>
            <Button size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</Button>
            <Button size="sm" onClick={()=>setPage(p=>Math.min(Math.max(1, Math.ceil(postImages.length / perPage)), p+1))} disabled={page===Math.max(1, Math.ceil(postImages.length / perPage))}>Next</Button>
          </div>
        </div>
        {renderGrid(postImages.slice((page - 1) * perPage, page * perPage), { table: 'posts', field: 'image_url', onDeleteSuccess: (id)=>setPostImages(prev=>prev.filter(i=>String(i.id)!==String(id))) })}
      </div>
    </div>
  )
}
