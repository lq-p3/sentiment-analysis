export enum Sentiment {
    POSITIVE = 'Positive',
    NEGATIVE = 'Negative',
    NEUTRAL = 'Neutral'
}

export interface Review {
    id: string;
    text: string;
    sentiment: Sentiment;
    source: string;
    date: string;
    author: string;
}

export interface AnalysisStats {
    totalReviews: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    averageRating: number; // 1-5 scale
}

export interface WordFreq {
    text: string;
    value: number;
}

export interface CityAnalysisData {
    cityName: string;
    stats: AnalysisStats;
    reviews: Review[];
    topWords: WordFreq[];
    timestamp: string;
}
