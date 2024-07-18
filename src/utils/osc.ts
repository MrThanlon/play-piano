export type Notes = {
  gain: GainNode,
  timer: number,
  play: () => void,
  stop: () => void
}

export function generate(
  ac: AudioContext,
  base: number,
  amplitude: number[],
  curve: (t: number) => number = defaultCurve): Notes {
  const gain = ac.createGain()
  gain.gain.value = 0
  gain.connect(ac.destination)
  amplitude.forEach((v, i) => {
    const g = ac.createGain()
    g.gain.value = v
    g.connect(gain)
    const osc = ac.createOscillator()
    osc.frequency.value = base * (i + 1)
    osc.connect(g)
    osc.start()
  })
  return {
    gain,
    timer: 0,
    play() {
      const start = Date.now()
      clearInterval(this.timer)
      this.timer = setInterval(() => {
        gain.gain.value = curve(Date.now() - start)
      }, 10)
    },
    stop() {
      clearInterval(this.timer)
      this.timer = setInterval(() => {
        gain.gain.value *= 0.9
      }, 10)
    }
  }
}

export function defaultCurve(t: number) {
  if (t < 50) {
    return t * 0.02
  } else {
    return 2 ** (-(t / 330))
  }
}
