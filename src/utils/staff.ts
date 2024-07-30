export class Staff {
  declare canvas: HTMLCanvasElement

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
  }

  async loadMSCX(buffer: Blob) {
    // treat buffer as xml
    const parser = new DOMParser()
    const dom = parser.parseFromString(await buffer.text(), 'text/xml')
    console.log(dom)
  }

  async loadMSCZ(buffer: Blob) {
    await this.loadMSCX(buffer)
  }

  mount(dom: HTMLElement) {
    dom.appendChild(this.canvas)
  }
}
