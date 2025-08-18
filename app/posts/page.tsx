"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [perPage, setPerPage] = useState<number>(9)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [perPage])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      // Fetch from the new view posts_with_profiles
      const { data, error } = await supabase.from("posts_with_profiles").select("*, full_name, avatar_url").order("created_at", { ascending: false })
      if (error) throw error
      setPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="flex justify-between items-center mt-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Posts</h1>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Showing {posts.length === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, posts.length)} of {posts.length}</div>
              <div className="flex items-center gap-2">
                <select aria-label="Items per page" value={perPage} onChange={(e)=>{ setPerPage(Number(e.target.value)); setPage(1) }} className="px-2 py-1 border rounded bg-white dark:bg-black text-sm">
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                </select>
                <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
                <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.min(Math.max(1, Math.ceil(posts.length / perPage)), p+1))} disabled={page===Math.max(1, Math.ceil(posts.length / perPage))}>Next</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice((page - 1) * perPage, page * perPage).map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover mb-4 rounded-lg" />}
                  <p className="text-muted-foreground line-clamp-3">{post.content}</p>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">By {post.full_name}</p>
                    <Link href={`/posts/${post.id}`}>
                      <Button variant="outline">Read More</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
