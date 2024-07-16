export function generate(ac: AudioContext, base: number, amptitude: number[], curve: (t: number) => number = defaultCurve) {
  const gain = ac.createGain()
  gain.gain.value = 0
  gain.connect(ac.destination)
  amptitude.forEach((v, i) => {
    const g = ac.createGain()
    g.gain.value = amptitude[i]
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
      this.timer = setInterval(() => {
        gain.gain.value = curve(Date.now() - start)
      }, 10)
    },
    stop() {
      clearInterval(this.timer)
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
