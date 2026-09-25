export interface NewsItem {
  readonly title: string;
  readonly description?: string;
  readonly url: string;
  readonly publishedAt: string;
  readonly source?: string;
}

export interface NewsProvider {
  getRecentNews(): Promise<readonly NewsItem[]>;
}
