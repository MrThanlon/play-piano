import { useMIDI } from "./midi";

export async function useKeyboard(
  onNoteOn: (pitch: number, velocity: number, correct: boolean) => void,
  onNoteOff: (pitch: number, expected: boolean) => void,
  onComplete: () => void
) {
  const expected = new Set<number>();
  const received = new Set<number>();
  const autoplayed = new Set<number>();
  const autoplayedBackup = new Set<number>();

  const prompter = await useMIDI(
    ({ data }) => {
      if (!data) {
        return;
      }
      const type = data[0] & 0xf0;
      if (type === 0x90 && data[2] > 0) {
        // key down
        const pitch = data[1];
        const velocity = data[2];
        const isCorrect = expected.has(pitch);
        onNoteOn(pitch, velocity, isCorrect);
        prompter([isCorrect ? 0x91 : 0x90, pitch, 127]);
        received.add(pitch);
        if (setIncluded(expected, received)) {
          autoplayed.forEach((pitch) => {
            onNoteOn(pitch, velocity, true);
            prompter([0x91, pitch, 127]);
            autoplayedBackup.add(pitch);
          });
          // next
          expected.clear();
          onComplete();
        }
      } else if (type === 0x80 || (type === 0x90 && data[2] === 0)) {
        // key up
        const pitch = data[1];
        const isExpected = expected.has(pitch);
        onNoteOff(pitch, isExpected);

        autoplayedBackup.forEach((autoPitch) => {
          onNoteOff(autoPitch, expected.has(autoPitch));
          prompter([0x93, autoPitch, 0]);
        });
        autoplayedBackup.clear();

        if (isExpected) {
          prompter([0x92, pitch, 127]);
        } else {
          // light off
          prompter([0x93, pitch, 0]);
        }
        received.delete(pitch);
      }
    },
    () => {
      // clear
      prompter([0x93, 0x6d, 0]);
      // send expected notes
      expected.forEach((pitch) => {
        prompter([0x92, pitch, 1]);
      });
    }
  );
  // clear
  prompter([0x93, 0x6d, 0]);

  return {
    setValue(expectedPitches: number[], autoplayedPitches: number[]) {
      expected.forEach((pitch) => {
        if (!received.has(pitch)) {
          prompter([0x93, pitch, 0]);
        }
      });
      expected.clear();
      expectedPitches.forEach((pitch) => {
        expected.add(pitch);
        prompter([0x92, pitch, 127]);
      });

      autoplayed.clear();
      autoplayedPitches.forEach((pitch) => autoplayed.add(pitch));

      if (expectedPitches.length === 0) {
        // execute autoplayed and complete
        setTimeout(() => {
          autoplayed.forEach((pitch) => {
            onNoteOn(pitch, 127, true);
            prompter([0x91, pitch, 127]);
            autoplayedBackup.add(pitch);
          });
          onComplete();
        }, 500); // FIXME: get speed
      }
    },
  };
}

function setIncluded(s1: Set<number>, s2: Set<number>) {
  return [...s1].every((x) => s2.has(x));
}
