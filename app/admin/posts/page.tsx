"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import toast from "react-hot-toast"
import { UploadCloud, Eye } from "lucide-react"
import Link from "next/link"

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  image_url: z.string().optional(),
})

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [perPage, setPerPage] = useState<number>(10)
  const [page, setPage] = useState<number>(1)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      image_url: "",
    },
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [/* future filters */])

  useEffect(() => {
    if (editingPost) {
      form.reset(editingPost)
      setImagePreview(editingPost.image_url)
    } else {
      form.reset()
      setImagePreview(null)
    }
  }, [editingPost, form])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast.error("Failed to fetch posts")
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (file: File) => {
    const filePath = `public/${file.name}`
    const { data, error } = await supabase.storage.from("posts").upload(filePath, file, { upsert: true })
    if (error) {
      console.error("Supabase upload error:", error)
      throw new Error(`Image upload failed: ${error.message}`)
    }
    const { data: publicUrlData } = supabase.storage.from("posts").getPublicUrl(filePath)
    return publicUrlData.publicUrl
  }

  const onSubmit = async (values: z.infer<typeof postSchema>) => {
    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")

      let imageUrl = values.image_url

      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile)
        } catch (uploadError: any) {
          console.error("Error during image upload:", uploadError)
          toast.error(uploadError.message || "Failed to upload image")
          return
        }
      }

      if (editingPost) {
        const { error } = await supabase
          .from("posts")
          .update({ ...values, user_id: user.id, image_url: imageUrl })
          .eq("id", editingPost.id)
        if (error) {
          console.error("Supabase update error:", error)
          throw new Error(`Failed to update post: ${error.message}`)
        }
        toast.success("Post updated successfully")
      } else {
        const { error } = await supabase.from("posts").insert([{ ...values, user_id: user.id, image_url: imageUrl }])
        if (error) {
          console.error("Supabase insert error:", error)
          throw new Error(`Failed to create post: ${error.message}`)
        }
        toast.success("Post created successfully")
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          await fetch('/api/push/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` }, body: JSON.stringify({ title: `New post: ${values.title}`, message: values.content, url: `/posts`, imageUrl: imageUrl, persist: true }) })
        } catch (e) {
          console.warn('failed to broadcast post push', e)
        }
      }

      form.reset()
      setImageFile(null)
      setImagePreview(null)
      setEditingPost(null)
      fetchPosts()
    } catch (error: any) {
      console.error("Error creating/updating post:", error)
      toast.error(error.message || "Failed to save post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleEdit = (post: any) => {
    setEditingPost(post)
  }

  const handleDelete = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const { error } = await supabase.from("posts").delete().eq("id", postId)
        if (error) throw error
        toast.success("Post deleted successfully")
        fetchPosts()
      } catch (error) {
        console.error("Error deleting post:", error)
        toast.error("Failed to delete post")
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{editingPost ? "Edit Post" : "Create Post"}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Post title" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Post content" {...field} rows={6} className="text-sm resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Image</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            placeholder="Image URL (Optional)"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e)
                              setImagePreview(e.target.value)
                              setImageFile(null)
                            }}
                            className="text-sm flex-1"
                          />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload">
                            <Button
                              asChild
                              variant="outline"
                              size={isMobile ? "sm" : "default"}
                              className="text-xs sm:text-sm bg-transparent"
                            >
                              <div>
                                <UploadCloud className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Upload
                              </div>
                            </Button>
                          </label>
                        </div>
                        {imagePreview && (
                          <div className="mt-2">
                            <img
                              src={imagePreview || "/placeholder.svg"}
                              alt="Image Preview"
                              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-md border"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size={isMobile ? "sm" : "default"}
                  className="text-xs sm:text-sm"
                >
                  {isSubmitting ? (editingPost ? "Updating..." : "Creating...") : editingPost ? "Update" : "Create"}
                </Button>
                {editingPost && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingPost(null)
                      form.reset()
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    disabled={isSubmitting}
                    size={isMobile ? "sm" : "default"}
                    className="text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Posts</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading posts...</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">Showing {posts.length === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, posts.length)} of {posts.length}</div>
                <div className="flex items-center gap-2">
                  <select aria-label="Items per page" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }} className="px-2 py-1 border rounded bg-white dark:bg-black text-sm">
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={40}>40</option>
                  </select>
                  <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <Button size="sm" onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(posts.length / perPage)), p + 1))} disabled={page === Math.max(1, Math.ceil(posts.length / perPage))}>Next</Button>
                </div>
              </div>

              {posts.slice((page - 1) * perPage, page * perPage).map((post) => (
                <div key={post.id} className="border rounded-lg p-3 sm:p-4 bg-background">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base break-words">{post.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/posts/${post.id}`} target="_blank">
                        <Button variant="outline" size="sm" disabled={isSubmitting} className="text-xs bg-transparent">
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(post)}
                        disabled={isSubmitting}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        disabled={isSubmitting}
                        className="text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No posts found. Create your first post!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
