import type { WidgetContent } from "$lib/types";

export default class {
  private readonly baseurl: string;
  private readonly key: string;

  constructor(key: string, baseurl: string = 'http://localhost:80') {
    this.baseurl = baseurl;
    this.key = key;
  }

  async getContent(): Promise<WidgetContent[]> {
    return [
      {
        title: 'Example Widget',
        content: 'Hello, world!',
        warning: false,
      }
    ]
  }
}