export async function start(handler: (event: MIDIMessageEvent) => void) {
  const midi = await navigator.requestMIDIAccess().catch(msg => {
    console.error(`Failed to get MIDI access - ${msg}`);
  })
  if (midi) {
    console.log("MIDI ready!")
    listInputsAndOutputs(midi)
    startLoggingMIDIInput(midi)
  }

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
