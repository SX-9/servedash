import { readableNumber } from "$lib/client";
import type { WidgetContent } from "$lib/types";

export default class {
  private readonly baseurl: string;
  private readonly key: string;
  private readonly errorReturn = [{
    title: 'Pi-hole',
    content: 'Failed to fetch data',
    warning: true
  }];

  constructor(key: string, baseurl: string = 'http://localhost:8800') {
    this.baseurl = baseurl;
    this.key = key;
  }

  async getContent(): Promise<WidgetContent[]> {
    try {
      const response = await fetch(`${this.baseurl}/admin/api.php?summaryRaw&auth=${this.key}`);
      if (!response.ok) {
        console.error(response.statusText);
        return this.errorReturn;
      }
      
      const data = await response.json();
      return [
        {
          title: 'Queries',
          content: readableNumber(data.dns_queries_today),
        },
        {
          title: 'Blocked',
          content: `${Math.round(data.ads_percentage_today)}%`,
        },
        {
          title: 'Domains on adlists',
          content: readableNumber(data.domains_being_blocked),
        },
      ];
    } catch (error) {
      console.error(error)
      return this.errorReturn;
    }
  }
}