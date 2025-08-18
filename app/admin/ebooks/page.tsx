"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import FilePreview from "reactjs-file-preview";

interface Ebook {
  id: string
  title: string
  description: string
  author: string
  price: number
  cover_image_url: string
  file_url: string
  file_type: string
  is_free: boolean
}

export default function AdminEbooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [author, setAuthor] = useState("")
  const [price, setPrice] = useState("0")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [ebookFile, setEbookFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  // Filtering and Pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPrice, setFilterPrice] = useState("all") // 'all', 'free', 'paid'
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalEbooks, setTotalEbooks] = useState(0)
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null)

  useEffect(() => {
    fetchEbooks()
  }, [searchTerm, filterPrice, currentPage, itemsPerPage])

  const fetchEbooks = async () => {
    let query = supabase.from("ebooks").select("*", { count: 'exact' })

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    if (filterPrice === 'free') {
      query = query.eq('price', 0)
    } else if (filterPrice === 'paid') {
      query = query.gt('price', 0)
    }

    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      toast.error("Failed to fetch ebooks: " + error.message)
      console.error("Error fetching ebooks:", error)
      return
    }
    setEbooks(data || [])
    setTotalEbooks(count || 0)
  }

  const handleUpload = async () => {
    if (!title || !description || !author) {
      toast.error("Please fill all required fields.")
      return
    }

    setIsUploading(true)

    try {
      let coverImageUrl = editingEbook?.cover_image_url || ""
      let ebookFileUrl = editingEbook?.file_url || ""
      let fileTypeValue = editingEbook?.file_type || "application/octet-stream"

      if (coverImage) {
        const coverData = new FormData()
        coverData.append("file", coverImage)
        const res = await fetch("/api/ebooks/upload", { method: "POST", body: coverData })
        const json = await res.json()
        if (!json.success) throw new Error("Cover upload failed.")
        coverImageUrl = json.link
      }

      if (ebookFile) {
        const fileData = new FormData()
        fileData.append("file", ebookFile)
        const res = await fetch("/api/ebooks/upload", { method: "POST", body: fileData })
        const json = await res.json()
        if (!json.success) throw new Error("E-book file upload failed.")
        ebookFileUrl = json.link
        fileTypeValue = ebookFile.type
      }

      if (editingEbook) {
        const { error } = await supabase.from("ebooks").update({
          title,
          description,
          author,
          price: parseFloat(price),
          cover_image_url: coverImageUrl,
          file_url: ebookFileUrl,
          file_type: fileTypeValue,
        }).eq("id", editingEbook.id)

        if (error) throw error
        toast.success("E-book updated successfully!")
      } else {
        const { error } = await supabase.from("ebooks").insert([{
          title,
          description,
          author,
          price: parseFloat(price),
          cover_image_url: coverImageUrl,
          file_url: ebookFileUrl,
          file_type: fileTypeValue,
        }])

        if (error) throw error
        toast.success("E-book uploaded successfully!")
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          await fetch('/api/push/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` }, body: JSON.stringify({ title: `New e-book: ${title}`, message: description, url: '/products/ebooks', imageUrl: coverImageUrl, persist: true }) })
        } catch (e) {
          console.warn('failed to broadcast ebook push', e)
        }
      }

      setTitle("")
      setDescription("")
      setAuthor("")
      setPrice("0")
      setCoverImage(null)
      setEbookFile(null)
      setEditingEbook(null)
      fetchEbooks()

    } catch (error: any) {
      toast.error(error.message || "Operation failed.")
    } finally {
      setIsUploading(false)
    }
  }


  const handleEditEbook = (ebook: Ebook) => {
    setEditingEbook(ebook)
    setTitle(ebook.title)
    setDescription(ebook.description)
    setAuthor(ebook.author)
    setPrice(ebook.price.toString())
    setCoverImage(null)
    setEbookFile(null)
  }


  const handleDeleteEbook = async (ebookId: string) => {
    if (!confirm("Are you sure you want to delete this e-book?")) return
    try {
      const { error } = await supabase.from("ebooks").delete().eq("id", ebookId)
      if (error) throw error
      toast.success("E-book deleted successfully!")
      fetchEbooks()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete e-book.")
    }
  }

  const handlePreviewEbook = (fileUrl: string, fileType: string) => {
    const isPdf = (fileType && fileType.startsWith('application/pdf')) || (fileUrl && fileUrl.toLowerCase().endsWith('.pdf'));
    if (fileUrl && isPdf) {
      // Use Google Docs Viewer for reliable PDF embedding
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      setPreviewUrl(googleViewerUrl);
      setShowPreviewModal(true);
    } else {
      toast.error("Preview is only available for PDF files.");
      setPreviewUrl("");
      setShowPreviewModal(false);
    }
  }

  const totalPages = Math.ceil(totalEbooks / itemsPerPage)

  return (
    <div className="p-4 lg:p-8 bg-background text-foreground min-h-screen">
      <h1 className="text-3xl lg:text-4xl font-bold mb-6">Manage E-books</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add New E-book Section */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4">Add New E-book</h2>
            <div className="space-y-4">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background text-foreground border-border" />
              <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="bg-background text-foreground border-border resize-y" />
              <Input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-background text-foreground border-border" />
              <Input type="number" placeholder="Price (0 for free)" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-background text-foreground border-border" />
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Cover Image</label>
                <Input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files ? e.target.files[0] : null)} className="bg-background text-foreground border-border" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">E-book File (PDF only)</label>
                <Input type="file" accept="application/pdf,.pdf" onChange={(e) => setEbookFile(e.target.files ? e.target.files[0] : null)} className="bg-background text-foreground border-border" />
              </div>
              <Button onClick={handleUpload} disabled={isUploading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isUploading ? "Uploading..." : "Upload E-book"}
              </Button>
            </div>
          </div>
        </div>

        {/* Existing E-books Section */}
        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4">Existing E-books</h2>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Input
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-white dark:bg-black text-foreground border-border"
              />
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="w-full sm:w-auto p-2 border rounded-md bg-white dark:bg-black text-foreground border-border"
              >
                <option value="all">All Prices</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* E-books List */}
            <div className="space-y-4">
              {ebooks.length === 0 && !isUploading ? (
                <p className="text-muted-foreground text-center py-8">No e-books found. Start by adding one!</p>
              ) : (
                ebooks.map((ebook) => (
                  <div key={ebook.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-muted/20 shadow-sm">
                    <div className="flex items-center gap-4">
                      <img src={ebook.cover_image_url || '/placeholder.jpg'} alt={ebook.title} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-lg">{ebook.title}</h3>
                        <p className="text-muted-foreground text-sm">{ebook.author}</p>
                        <p className="text-sm">{ebook.price === 0 ? "Free" : `₦${ebook.price.toLocaleString()}`}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <Button variant="outline" size="sm" onClick={() => handlePreviewEbook(ebook.file_url, ebook.file_type)}>
                        <Eye className="h-4 w-4 mr-2" /> Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditEbook(ebook)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEbook(ebook.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* E-book Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>E-book Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="E-book Preview"
              >
                This browser does not support PDFs. Please download the PDF to view it: <a href={previewUrl}>Download PDF</a>
              </iframe>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No preview available or unsupported file type.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

