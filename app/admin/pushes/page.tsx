"use client"

import React, { useState, useEffect } from 'react'
import createDOMPurify from 'isomorphic-dompurify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'


export default function AdminPushesPage() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [gallery, setGallery] = useState<any[]>([])
  const [pushHistory, setPushHistory] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [editingPushId, setEditingPushId] = useState<string | null>(null)

  useEffect(() => { fetchSubscribers() }, [])

  const fetchSubscribers = async () => {
    const { data, error } = await supabase.from('push_subscribers').select('*').order('created_at', { ascending: false })
    if (error) return console.error(error)
    setSubscribers(data || [])
  }

  const sendPush = async () => {
    setSending(true)
    try {
      const DOMPurify = createDOMPurify()
      const safeHtml = DOMPurify.sanitize(message)
      // convert sanitized HTML to plain text for push body
      const tmp = typeof document !== 'undefined' ? document.createElement('div') : null
      if (tmp) tmp.innerHTML = safeHtml
      const plainText = tmp ? (tmp.textContent || tmp.innerText || '') : safeHtml.replace(/<[^>]+>/g, '')
      // include current user JWT for admin verification
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      // if we are editing an existing push, update via admin endpoint
      let res
      if (editingPushId) {
        res = await fetch(`/api/push/messages/${editingPushId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
          body: JSON.stringify({ title, message: plainText, payload: { imageUrl } })
        })
      } else {
        // send plain text only; server will use `message` as the push body
        res = await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
          body: JSON.stringify({ title, message: plainText, imageUrl })
        })
      }
      const json = await res.json()
      console.log('send result', json)
      if (!res.ok) {
        const serverMsg = json?.error || json?.message || 'Failed to send'
        toast.error(serverMsg)
      } else {
        toast.success(editingPushId ? 'Push updated' : 'Push sent')
        if (editingPushId) setEditingPushId(null)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to send push')
    } finally { setSending(false) }
  }

  const uploadImage = async (file: File) => {
    setImageUploading(true)
    setUploadProgress(null)
    try {
      // Request server-signed upload token (server will validate admin via Authorization header)
      const form = new FormData()
      form.append('filename', file.name)

      // call our sign-url endpoint
      // prefer getting the current session token from supabase client
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        toast.error('Not authenticated — please sign in again')
        throw new Error('missing token')
      }

      const tokenRes = await fetch('/api/push/uploads/sign-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ filename: file.name })
      })
      const tokenJson = await tokenRes.json()
      if (!tokenJson.ok) throw new Error(tokenJson.error || 'failed to get signed upload')

      const { signedUpload, path, publicUrl } = tokenJson

      // signedUpload contains url and token fields (supabase storage createSignedUploadUrl)
      const uploadUrl = signedUpload?.url || signedUpload?.signedUrl
      const uploadToken = signedUpload?.token || signedUpload?.token
  if (!uploadUrl) throw new Error('signed upload url missing')

      // Upload file via PUT with progress using XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        // supabase expects the token as a query param 'token' sometimes; createSignedUploadUrl already encoded it
        xhr.setRequestHeader('x-upsert', 'true')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(pct)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`upload failed: ${xhr.status}`))
        }
        xhr.onerror = (ev) => reject(new Error('upload error'))
        xhr.send(file)
      })

      // After upload, set public url (server returned publicUrl)
      if (publicUrl) setImageUrl(publicUrl)

      // refresh gallery
      await fetchGallery()
    } catch (e) {
      console.error('upload failed', e)
      toast.error('Image upload failed')
    } finally {
      setImageUploading(false)
      setUploadProgress(null)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadImage(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await uploadImage(file)
  }

  const fetchGallery = async () => {
    try {
  // call server endpoint which uses service role to list push-images and return public urls
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch('/api/push/images', { headers: { Authorization: `Bearer ${token || ''}` } })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error || 'failed to fetch images')
  setGallery((json.data || []).reverse())
    } catch (e) {
  console.error('failed to fetch gallery', e)
  toast.error('Failed to load push images')
    }
  }

  const fetchPushHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/push/history', { headers: { Authorization: `Bearer ${token || ''}` } })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'failed to fetch history')
      setPushHistory(json.data || [])
    } catch (e) {
  console.error('failed to fetch push history', e)
  toast.error('Failed to load push history')
    }
  }

  useEffect(() => { fetchGallery() }, [])
  useEffect(() => { fetchPushHistory() }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Push Notifications</h2>
      <p className="text-sm text-muted-foreground">Manage web push subscribers and send messages.</p>

      <div className="mt-4">
        <h3 className="font-medium">Create Push</h3>
          <div className="mt-2">
            <div className="flex gap-2 mb-2">
              <Input placeholder="Title" value={title} onChange={(e:any)=>setTitle(e.target.value)} />
              <Input placeholder="Image URL (optional)" value={imageUrl} onChange={(e:any)=>setImageUrl(e.target.value)} />
              <Button onClick={sendPush} disabled={sending}>{sending? 'Sending...' : 'Send'}</Button>
            </div>
            {/* Inline quick-reuse gallery under the Image URL input */}
            <div className="mb-2">
              <div className="text-xs text-muted-foreground mb-1">Or pick from previously uploaded push images</div>
              <div className="flex gap-2 items-center overflow-x-auto py-1">
                {gallery.length === 0 && <div className="text-xs text-muted-foreground">No uploaded push images yet.</div>}
                {gallery.slice(0, 12).map(item => (
                  <button
                    key={item.path}
                    onClick={() => setImageUrl(item.url)}
                    title={item.name}
                    className="flex-shrink-0 w-12 h-12 rounded border overflow-hidden hover:opacity-90"
                    aria-label={`Use image ${item.name}`}
                  >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          <div className="border rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Message</div>
              <div className="flex items-center gap-2">
                <input id="push-image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <label htmlFor="push-image-input" className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary">
                  <UploadCloud className="h-4 w-4" />
                  <span>{imageUploading ? 'Uploading...' : 'Upload Image'}</span>
                </label>
                {imageUrl ? (
                  <img src={imageUrl} alt="thumb" className="w-8 h-8 rounded object-cover border ml-2" />
                ) : null}
              </div>
            </div>
            <div onDrop={handleDrop} onDragOver={(e)=>e.preventDefault()}>
              <textarea
                value={message}
                onChange={(e)=>setMessage(e.target.value)}
                placeholder="Write your notification message (plain text only)"
                className="w-full min-h-[120px] p-2 bg-transparent border rounded text-sm"
              />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="font-medium">Preview</h4>
            <div className="mt-2">
              {/* Small mock of a web push notification */}
              <div className="max-w-sm w-full bg-white dark:bg-black border rounded-lg shadow p-3 flex items-start gap-3">
                <img src="/logo.png" alt="App" className="w-12 h-12 rounded-md object-contain" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{title || 'Notification Title'}</div>
                  <div className="text-xs text-muted-foreground mt-1 max-h-20 overflow-hidden">
                    {/* show plain-text preview (strip HTML) */}
                    <div>{(message && typeof document !== 'undefined') ? ((() => { const t = document.createElement('div'); t.innerHTML = message; return t.textContent || t.innerText || ''; })()) : 'Notification content preview'}</div>
                  </div>
                </div>
                {imageUploading ? (
                  <div className="w-16 h-16 flex items-center justify-center ml-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Push image" className="w-16 h-16 rounded-md object-cover ml-2" />
                ) : null}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">This preview shows how the push will appear to users (app icon, title, body, optional image).</div>
            </div>
            {uploadProgress !== null && (
              <div className="mt-2">
                <div className="w-full bg-muted rounded h-2 overflow-hidden">
                  <div className={`h-2 bg-primary ${uploadProgress !== null ? `w-[${uploadProgress}%]` : 'w-0'}`} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Uploading: {uploadProgress}%</div>
              </div>
            )}
          </div>
          <div className="mt-3">
                <h4 className="font-medium">Uploaded Images</h4>
            <div className="mt-2 flex gap-2 overflow-x-auto py-2">
              {gallery.length === 0 && <div className="text-xs text-muted-foreground">No uploads yet.</div>}
              {gallery.map(item => (
                <button key={item.path} onClick={()=>setImageUrl(item.url)} className="flex-shrink-0 border rounded overflow-hidden w-20 h-20">
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

          <div className="mt-6">
            <h3 className="font-medium">Previous Pushes</h3>
            <p className="text-sm text-muted-foreground">Recent pushes (you can re-send without saving another record)</p>
            <div className="mt-2 space-y-2">
              {pushHistory.length === 0 && <div className="text-xs text-muted-foreground">No push history.</div>}
              {pushHistory.map(p => (
                <div key={p.id} className="flex items-center justify-between border p-2 rounded">
                  <div>
                    <div className="font-semibold text-sm">{p.title || 'Untitled'}</div>
                    <div className="text-xs text-muted-foreground">{p.message}</div>
                    <div className="text-xs text-muted-foreground">{p.sent_at ? new Date(p.sent_at).toLocaleString() : 'Unknown'}</div>
                  </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={()=>{ setTitle(p.title||''); setMessage(p.message||''); setImageUrl(p?.payload?.imageUrl || ''); setEditingPushId(p.id) }}>Load</Button>
                      <Button size="sm" onClick={async ()=>{
                        // repush without persisting
                        const { data: { session } } = await supabase.auth.getSession()
                        const token = session?.access_token
                        try {
                          const res = await fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` }, body: JSON.stringify({ title: p.title, message: p.message, imageUrl: p?.payload?.imageUrl, skipPersist: true }) })
                          const j = await res.json()
                          if (!res.ok) { toast.error(j?.error || 'Repush failed') } else { toast.success('Repush sent') }
                        } catch (e) { console.error(e); toast.error('Repush failed') }
                      }}>Repush</Button>
                      <Button size="sm" variant="outline" onClick={()=>{ setTitle(p.title||''); setMessage(p.message||''); setImageUrl(p?.payload?.imageUrl || ''); setEditingPushId(p.id) }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={async ()=>{
                        if (!confirm('Delete this push message?')) return
                        try {
                          const { data: { session } } = await supabase.auth.getSession()
                          const token = session?.access_token
                          const res = await fetch(`/api/push/messages/${p.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` } })
                          const j = await res.json()
                          if (!res.ok) { toast.error(j?.error || 'Delete failed') } else { toast.success('Deleted'); fetchPushHistory() }
                        } catch (e) { console.error(e); toast.error('Delete failed') }
                      }}>Delete</Button>
                    </div>
                </div>
              ))}
            </div>
          </div>

      <div className="mt-6">
        <h3 className="font-medium">Subscribers</h3>
        <div className="mt-2 space-y-2">
          {subscribers.map(s => (
            <div key={s.id} className="flex items-center justify-between border p-2 rounded">
              <div>
                <div className="text-sm">ID: {s.id}</div>
                <div className="text-xs text-muted-foreground">Added: {new Date(s.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{s.endpoint ? 'OK' : 'Unknown'}</Badge>
                <Button variant="ghost" onClick={async ()=>{ await supabase.from('push_subscribers').delete().eq('id', s.id); fetchSubscribers() }}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
