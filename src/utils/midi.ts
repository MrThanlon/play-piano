export async function useMIDI(
  onInput: (event: MIDIMessageEvent) => void,
  onChange?: (event: MIDIConnectionEvent) => void
) {
  if (!navigator.requestMIDIAccess) {
    // browser not support
    throw "Your browser do not support MIDI, try Chrome or Firefox instead.";
  }
  const midi = await navigator.requestMIDIAccess({ sysex: true });
  for (const entry of midi.inputs) {
    console.log(entry[1]);
  }

  for (const entry of midi.outputs) {
    console.log(entry[1]);
  }

  midi.addEventListener("statechange", (event) => {
    console.log("statechange");
    for (const entry of midi.inputs) {
      console.log(entry[1]);
    }

    for (const entry of midi.outputs) {
      console.log(entry[1]);
    }
    midi.inputs.forEach((entry) => {
      entry.removeEventListener("midimessage", handler);
    });

    midi.inputs.forEach((entry) => {
      entry.addEventListener("midimessage", handler);
    });
    onChange?.(event);
  });

  midi.inputs.forEach((entry) => {
    entry.addEventListener("midimessage", handler);
  });

  function send(data: Iterable<number>) {
    for (const entry of midi.outputs) {
      const output = entry[1];
      output.send(data);
    }
  }

  function handler(event: MIDIMessageEvent) {
    if (
      event.data &&
      (event.data[0] & 0xf0) === 0xb0 &&
      event.data[1] === 0x7
    ) {
      send(event.data);
    }
    onInput(event);
  }

  return send;
}
