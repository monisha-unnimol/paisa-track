import { create } from 'zustand';
import { databaseService } from '../database';
import { CreateReviewRequestInput, ReviewRequest } from '../database/types';

type ReviewStore = {
  reviews: ReviewRequest[];
  pendingCount: number;
  loading: boolean;
  loadReviews: () => Promise<void>;
  createReview: (input: CreateReviewRequestInput) => Promise<ReviewRequest>;
  approveReview: (id: string) => Promise<void>;
  rejectReview: (id: string) => Promise<void>;
  getPendingReviews: () => ReviewRequest[];
};

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  pendingCount: 0,
  loading: false,

  loadReviews: async () => {
    set({ loading: true });
    try {
      const [reviews, pendingCount] = await Promise.all([
        databaseService.getReviewRequests(),
        databaseService.getPendingReviewCount(),
      ]);
      set({ reviews, pendingCount, loading: false });
    } catch (error) {
      console.error('[ReviewStore] loadReviews failed', error);
      set({ loading: false });
    }
  },

  createReview: async (input) => {
    const review = await databaseService.createReviewRequest(input);
    set((state) => ({
      reviews: [review, ...state.reviews],
      pendingCount: state.pendingCount + 1,
    }));
    return review;
  },

  approveReview: async (id) => {
    await databaseService.updateReviewRequestStatus(id, 'approved');
    set((state) => ({
      reviews: state.reviews.map((item) =>
        item.id === id ? { ...item, status: 'approved' as const } : item,
      ),
      pendingCount: Math.max(0, state.pendingCount - 1),
    }));
  },

  rejectReview: async (id) => {
    await databaseService.updateReviewRequestStatus(id, 'rejected');
    set((state) => ({
      reviews: state.reviews.map((item) =>
        item.id === id ? { ...item, status: 'rejected' as const } : item,
      ),
      pendingCount: Math.max(0, state.pendingCount - 1),
    }));
  },

  getPendingReviews: () => get().reviews.filter((item) => item.status === 'pending'),
}));
