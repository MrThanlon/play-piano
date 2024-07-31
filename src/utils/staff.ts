export class Staff {
  private declare canvas: HTMLCanvasElement
  private declare ctx: CanvasRenderingContext2D 

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw "Can't get 2d context"
    }
    this.ctx = ctx
    this.ctx.fillStyle = 'white'
    this.ctx.fillRect(0, 0, width, height)
    this.render()
  }

  private render() {

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

  resize(width: number, height: number) {
    this.canvas.width = width
    this.canvas.height = height
    // TODO
  }

  mount(dom: HTMLElement) {
    dom.appendChild(this.canvas)
  }
}
