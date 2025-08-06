"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import toast from "react-hot-toast"
import { useAuthStore } from "@/hooks/use-auth"
import { Header } from "@/components/layout/header"
import { Skeleton } from "@/components/ui/skeleton"
import { ThumbsUp, ThumbsDown, Heart, MessageSquare } from "lucide-react"

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
})

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: { full_name: string; avatar_url: string }
  user_id: string
  parent_comment_id: string | null
}

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[]
}

export default function SinglePostPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore()
  const [post, setPost] = useState<any>(null)
  const [author, setAuthor] = useState<any>(null)
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [postReactions, setPostReactions] = useState<any[]>([])
  const [commentReactions, setCommentReactions] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  })

  const replyForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  })

  const fetchPostAndAuthor = useCallback(async () => {
    setLoading(true)
    try {
      const { data: postData, error: postError } = await supabase.from("posts").select("*").eq("id", params.id).single()
      if (postError) throw postError
      setPost(postData)

      if (postData?.user_id) {
        const { data: profileData, error: profileError } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", postData.user_id).single()
        if (profileError) throw profileError
        setAuthor(profileData)
      }
    } catch (error) {
      console.error("Error fetching post or author:", error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const fetchComments = useCallback(async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: true })

      if (commentsError) throw commentsError

      // Fetch user profiles for each unique user_id
      const userIds = Array.from(new Set(commentsData.map(c => c.user_id).filter(Boolean)))
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds)

      if (profilesError) throw profilesError

      // Map user_id to profile
      const profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p]))

      const enhancedComments = commentsData.map(comment => ({
        ...comment,
        profiles: profileMap[comment.user_id] || { full_name: "Unknown", avatar_url: null },
      }))

      const commentsById: { [key: string]: CommentWithReplies } = {}
      const topLevelComments: CommentWithReplies[] = []

      enhancedComments.forEach(comment => {
        commentsById[comment.id] = { ...comment, replies: [] }
      })

      enhancedComments.forEach(comment => {
        if (comment.parent_comment_id && commentsById[comment.parent_comment_id]) {
          commentsById[comment.parent_comment_id].replies.push(commentsById[comment.id])
        } else {
          topLevelComments.push(commentsById[comment.id])
        }
      })

      setComments(topLevelComments)

      const reactionsMap: { [key: string]: any[] } = {}
      for (const comment of enhancedComments || []) {
        const { data: reactionsData, error: reactionsError } = await supabase
          .from("reactions")
          .select("*")
          .eq("comment_id", comment.id)

        if (reactionsError) throw reactionsError
        reactionsMap[comment.id] = reactionsData || []
      }

      setCommentReactions(reactionsMap)
    } catch (error) {
      console.error("Error fetching comments or reactions:", error)
    }
  }, [])


  const fetchPostReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("reactions").select("*").eq("post_id", params.id).is("comment_id", null)
      if (error) throw error
      setPostReactions(data || [])
    } catch (error) {
      console.error("Error fetching post reactions:", error)
    }
  }, [params.id])

  useEffect(() => {
    fetchPostAndAuthor()
    fetchComments()
    fetchPostReactions()
  }, [fetchPostAndAuthor, fetchComments, fetchPostReactions])

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${params.id}` }, payload => {
        fetchComments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id, fetchComments])

  const handleReaction = async (type: "post" | "comment", reactionType: string, targetId: string) => {
    if (!user) {
      toast.error("You must be logged in to react")
      return
    }

    try {
      let existingReaction: any = null
      if (type === "post") {
        existingReaction = postReactions.find(r => r.user_id === user.id && r.reaction_type === reactionType)
      } else {
        existingReaction = commentReactions[targetId]?.find((r: { user_id: string; reaction_type: string }) => r.user_id === user.id && r.reaction_type === reactionType)
      }

      if (existingReaction) {
        const { error } = await supabase.from("reactions").delete().eq("id", existingReaction.id)
        if (error) throw error
        toast.success("Reaction removed")
      } else {
        const { error } = await supabase.from("reactions").insert([
          {
            user_id: user.id,
            post_id: type === "post" ? params.id : null,
            comment_id: type === "comment" ? targetId : null,
            reaction_type: reactionType,
          },
        ])
        if (error) throw error
        toast.success("Reaction added")
      }

      if (type === "post") {
        fetchPostReactions()
      } else {
        fetchComments()
      }
    } catch (error) {
      console.error("Error handling reaction:", error)
      toast.error("Failed to handle reaction")
    }
  }

  const getReactionCount = (reactions: any[], reactionType: string) => {
    return reactions.filter(r => r.reaction_type === reactionType).length
  }

  const userHasReacted = (reactions: any[], reactionType: string) => {
    return reactions.some(r => r.user_id === user?.id && r.reaction_type === reactionType)
  }

  const onSubmit = async (values: { content: string }, parentId: string | null = null) => {
    if (!user) {
      toast.error("You must be logged in to comment.")
      return
    }

    try {
      const { error } = await supabase.from("comments").insert([
        {
          content: values.content,
          post_id: params.id,
          user_id: user.id,
          parent_comment_id: parentId,
        },
      ])

      if (error) throw error

      toast.success("Comment posted!")
      if (parentId) {
        replyForm.reset()
        setReplyingTo(null)
      } else {
        form.reset()
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast.error("Failed to submit comment")
    }
  }

  const CommentCard = ({ comment }: { comment: CommentWithReplies }) => {
    return (
      <div className="flex gap-2 sm:gap-4">
        <Avatar>
          <AvatarImage src={comment.profiles.avatar_url} />
          <AvatarFallback>{comment.profiles.full_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <p className="font-semibold text-sm md:text-base">{comment.profiles.full_name}</p>
            <p className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</p>
          </div>
          <p className="text-sm md:text-base py-2">{comment.content}</p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => handleReaction("comment", "like", comment.id)} className={`${userHasReacted(commentReactions[comment.id] || [], "like") ? "text-blue-500" : ""} flex items-center gap-1`}>
              <ThumbsUp className="h-4 w-4" /> <span>{getReactionCount(commentReactions[comment.id] || [], "like")}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleReaction("comment", "dislike", comment.id)} className={`${userHasReacted(commentReactions[comment.id] || [], "dislike") ? "text-red-500" : ""} flex items-center gap-1`}>
              <ThumbsDown className="h-4 w-4" /> <span>{getReactionCount(commentReactions[comment.id] || [], "dislike")}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleReaction("comment", "heart", comment.id)} className={`${userHasReacted(commentReactions[comment.id] || [], "heart") ? "text-pink-500" : ""} flex items-center gap-1`}>
              <Heart className="h-4 w-4" /> <span>{getReactionCount(commentReactions[comment.id] || [], "heart")}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" /> <span>Reply</span>
            </Button>
          </div>
          {replyingTo === comment.id && (
            <div className="mt-4">
              <form onSubmit={replyForm.handleSubmit(values => onSubmit(values, comment.id))} className="space-y-4">
                <Textarea {...replyForm.register("content")} placeholder={`Replying to ${comment.profiles.full_name}...`} />
                <Button type="submit">Post Reply</Button>
              </form>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 md:pl-8 border-l-2 border-muted">
              {comment.replies.map(reply => (
                <CommentCard key={reply.id} comment={reply} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !post ? (
          <p>Post not found</p>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  By {author?.full_name || "Unknown"} on {new Date(post.created_at).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-96 object-cover mb-4 rounded-lg" />}
                <div className="prose dark:prose-invert max-w-none">{post.content}</div>
                <div className="flex items-center flex-wrap gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => handleReaction("post", "like", post.id)} className={`${userHasReacted(postReactions, "like") ? "text-blue-500" : ""} flex items-center gap-1`}>
                    <ThumbsUp className="h-4 w-4" /> <span>{getReactionCount(postReactions, "like")}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleReaction("post", "dislike", post.id)} className={`${userHasReacted(postReactions, "dislike") ? "text-red-500" : ""} flex items-center gap-1`}>
                    <ThumbsDown className="h-4 w-4" /> <span>{getReactionCount(postReactions, "dislike")}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleReaction("post", "heart", post.id)} className={`${userHasReacted(postReactions, "heart") ? "text-pink-500" : ""} flex items-center gap-1`}>
                    <Heart className="h-4 w-4" /> <span>{getReactionCount(postReactions, "heart")}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Comments</h2>
              <div className="space-y-4">
                {comments.map(comment => (
                  <CommentCard key={comment.id} comment={comment} />
                ))}
              </div>

              {user && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Leave a Comment</h3>
                  <form onSubmit={form.handleSubmit(values => onSubmit(values))} className="space-y-4">
                    <Textarea {...form.register("content")} placeholder="Write your comment..." />
                    <Button type="submit">Post Comment</Button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}