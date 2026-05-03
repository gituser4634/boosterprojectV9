"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * 1. REVIEW FORM COMPONENT
 * Allows a client to submit a rating and comment for a specific COMPLETED order.
 */
export function ReviewForm({ 
  orderId, 
  onReviewSubmitted 
}: { 
  orderId: string, 
  onReviewSubmitted?: () => void 
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Review submitted successfully!" });
        setComment("");
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to submit review" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-outline/20 bg-surface-container p-6">
      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Your Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`h-8 w-8 ${star <= rating ? "fill-primary text-primary" : "text-outline/30"}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Your Feedback</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was your experience with this booster?"
          className="min-h-[100px] border-outline/20 bg-surface-container-high focus:border-primary"
        />
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm font-bold ${message.type === "success" ? "bg-primary/10 text-primary border border-primary/20" : "bg-error/10 text-error border border-error/20"}`}>
          {message.text}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="cta-flame-soft cta-flame-soft-primary w-full py-6 text-base font-bold"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}

/**
 * 2. REVIEW CARD COMPONENT
 * Individual review item display.
 */
function ReviewCard({ review }: { review: any }) {
  return (
    <div className="ghost-border flex flex-col rounded-xl bg-surface-container-low p-6 transition-all duration-300 hover:bg-surface-container-high/50 hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < review.rating ? "fill-primary text-primary" : "text-outline/30"}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/60">
          {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      
      <p className="mb-8 flex-grow italic leading-relaxed text-on-surface/90">
        &quot;{review.comment || "No comment provided."}&quot;
      </p>

      <div className="mt-auto flex items-center gap-4 pt-4 border-t border-outline/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-black text-primary shadow-inner">
          {(review.customer.displayName?.[0] || review.customer.username[0]).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight">{review.customer.displayName || review.customer.username}</div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-primary/80">
            <span className="h-1 w-1 rounded-full bg-primary animate-pulse"></span>
            Verified Client
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. REVIEW SYSTEM COMPONENT (List + Modal)
 * Fetches and displays reviews for a booster, with a "View all" modal if many exist.
 */
export function ReviewSystem({ boosterId }: { boosterId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?boosterId=${boosterId}`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (error) {
      console.error("Failed to load reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [boosterId]);

  if (isLoading) return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-surface-container-high/50 border border-outline/10"></div>
      ))}
    </div>
  );

  if (reviews.length === 0) return (
    <div className="ghost-border rounded-xl bg-surface-container-low/50 p-12 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-on-surface-variant/60">
        This booster hasn&apos;t received any reviews yet.
      </p>
    </div>
  );

  const initialReviews = reviews.slice(0, 4);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {initialReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {reviews.length > 4 && (
        <div className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="ghost-border border-outline/20 px-10 py-6 font-bold uppercase tracking-[0.2em] text-primary hover:bg-primary/5 hover:border-primary/40 transition-all"
              >
                View All {reviews.length} Reviews
              </Button>
            </DialogTrigger>
            <DialogContent className="ghost-border fixed left-[50%] top-[50%] z-[100] grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden bg-surface-container-highest/95 p-0 shadow-2xl backdrop-blur-2xl duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-2xl">
              <DialogHeader className="border-b border-outline/10 p-8">
                <DialogTitle className="font-headline text-3xl font-black uppercase italic tracking-tighter text-on-surface">
                  Elite <span className="text-primary">Feedback</span>
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40">
                <div className="grid grid-cols-1 gap-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
