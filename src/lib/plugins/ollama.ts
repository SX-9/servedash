import { readableByteSize, readableNumber } from "$lib/client";
import type { WidgetContent } from "$lib/types";

export default class Ollama {
  private readonly baseurl: string;
  private readonly errorReturn = [{
    title: 'Ollama',
    content: 'Failed to fetch data',
    warning: true
  }];

  constructor(_: string, baseurl: string = 'http://localhost:8800') {
    this.baseurl = baseurl;
  }

  async getContent(): Promise<WidgetContent[]> {
    try {
      const resPs = await fetch(`${this.baseurl}/api/ps`);
      const resLs = await fetch(`${this.baseurl}/api/tags`);
      if (!resPs.ok || !resLs.ok) {
        console.error(resPs.statusText);
        console.error(resLs.statusText);
        return this.errorReturn;
      }

      const ps = await resPs.json();
      const ls = await resLs.json();
      return [
        {
          title: 'Models',
          content: readableNumber(ls?.models?.length),
        },
        {
          title: 'Running',
          content: readableNumber(ps?.models?.length),
        },
        {
          title: 'Total size',
          content: readableByteSize(ls?.models?.reduce((acc: number, m: { size: number; }) => acc + m.size, 0)),
        },
      ]
    } catch (error) {
      console.error(error);
      return this.errorReturn;
    }
  } 
}