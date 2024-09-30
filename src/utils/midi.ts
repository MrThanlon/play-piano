let accessed = false

export async function start(handler: (event: MIDIMessageEvent) => void) {
  navigator.requestMIDIAccess({ sysex: true })
    .then(midi => {
      accessed = true
      console.log("MIDI ready!")
      listInputsAndOutputs(midi)
      startLoggingMIDIInput(midi)
    })
    .catch(msg => {
      accessed = true
      console.error(`Failed to get MIDI access - ${msg}`)
    })
  setTimeout(() => {
    if (!accessed) {
      start(handler)
    }
  }, 2000)

  function listInputsAndOutputs(midiAccess: MIDIAccess) {
    for (const entry of midiAccess.inputs) {
      const input = entry[1];
      console.log(
        `Input port [type:'${input.type}']` +
          ` id:'${input.id}'` +
          ` manufacturer:'${input.manufacturer}'` +
          ` name:'${input.name}'` +
          ` version:'${input.version}'`,
      );
    }

    for (const entry of midiAccess.outputs) {
      const output = entry[1];
      console.log(
        `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`
      )
    }
  }

  function startLoggingMIDIInput(midiAccess: MIDIAccess) {
    midiAccess.inputs.forEach((entry) => {
      entry.addEventListener('midimessage', handler)
    });
  }
}
