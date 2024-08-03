import FClef from '../assets/FClef.svg'
import GClef from '../assets/GClef.svg'
import n1 from '../assets/Semibreve.svg'
import n2 from '../assets/Half_note_with_upwards_stem.svg'
import n4 from '../assets/Quarter_note_with_upwards_stem.svg'
import n8 from '../assets/File-8thNote.svg'
import n16 from '../assets/File-Sixteenth_note_with_upwards_stem.svg'

const valueMap = {
  1: n1,
  .5: n2,
  .25: n4,
  .125: n8,
  .0625: n16
}

type Node = {
  pitch: number
  value: keyof typeof valueMap
}

const loadedImages: Map<string, HTMLImageElement> = new Map()

function loadImage(src: string): Promise<HTMLImageElement> {
  const loaded = loadedImages.get(src)
  if (loaded) {
    return new Promise(resolve => resolve(loaded))
  }
  const img = new Image()
  img.src = src
  return new Promise((resolve, _reject) => {
    img.onload = () => {
      loadedImages.set(src, img)
      resolve(img)
    }
  })
}

const gap = 0.1
const startGclef = 0.8
const startFclef = -0.2
const startX = -0.8
const endX = 0.8

async function drawNotes(ctx: CanvasRenderingContext2D, node: Node, position: number, GClef: boolean = true) {
  const { pitch, value } = node
  const valueImage = await loadImage(valueMap[value])
  ctx.drawImage(valueImage, position, startGclef, 0.06, 0.2)
}

async function drawLines(ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = 0.01
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(startX, startGclef - gap * i)
    ctx.lineTo(endX, startGclef - gap * i)
    ctx.stroke()
    ctx.moveTo(startX, startFclef - gap * i)
    ctx.lineTo(endX, startFclef - gap * i)
    ctx.stroke()
  }
  const GClefImage = await loadImage(GClef)
  const FClefImage = await loadImage(FClef)
  ctx.save()
  ctx.scale(1, -1)
  ctx.drawImage(GClefImage, startX, -startGclef - gap, 0.15, 0.66)
  ctx.drawImage(FClefImage, startX, -startFclef, 0.2, 0.32)
  ctx.restore()

  // test
  // drawNotes(ctx, { pitch: 1, value: .25}, -0.2)
}

export class Staff {
  private declare canvas: HTMLCanvasElement
  private declare ctx: CanvasRenderingContext2D
  private declare Gclef: Node[]
  private declare Fclef: Node[]

  constructor(width: number, height: number) {
    this.Gclef = []
    this.Fclef = []
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'
    width *= window.devicePixelRatio
    height *= window.devicePixelRatio
    this.canvas.width = width
    this.canvas.height = height
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw "Can't get 2d context"
    }
    this.ctx = ctx
    this.ctx.fillStyle = 'white'
    this.ctx.fillRect(0, 0, width, height)
    // setup to normal axies
    this.ctx.lineWidth = 0.01
    this.ctx.scale(width / 2, -height / 2)
    this.ctx.translate(1, -1)
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    // draw 5 lines
    drawLines(this.ctx)
    this.render()
  }

  private render() {
  }

  async loadMSCX(buffer: string) {
    // treat buffer as xml
    const parser = new DOMParser()
    const dom = parser.parseFromString(buffer, 'text/xml')
    console.log(dom)
  }

  async loadMSCZ(buffer: Blob) {
    await this.loadMSCX(await buffer.text())
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
