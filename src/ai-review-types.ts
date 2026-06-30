export type AiReviewAnswer = "yes" | "no" | "unknown";

export type AiReviewItem = {
  id: string;
  answer: AiReviewAnswer;
  comment: string;
};

export type AiReviewReport = {
  items: AiReviewItem[];
  summary: string;
  model: string;
  reviewedAt: number;
};

export type AiReviewError = {
  message: string;
};
