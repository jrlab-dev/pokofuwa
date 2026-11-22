/* 時計アプリと同じ四句の旋律と正時の大鐘。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LittleCompanionMusicClock = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const phrases = [[64,68,66,59],[64,66,68,64],[68,64,66,59],[59,66,68,64]];
  const melody = [[.5,.052,2.85],[1,.18,2.6],[1.2,.046,1.8],[2.005,.07,1.35],[2.98,.035,.58],[4.17,.021,.24]];
  const greatBell = [[.5,.14,4.8],[1,.22,4.2],[1.2,.075,3.2],[2.004,.092,2.6],[2.97,.048,1.45],[4.18,.025,.46]];
  function score(hour) {
    const notes = [];
    phrases.forEach((phrase, bar) => phrase.forEach((midi, i) => {
      notes.push({midi, start:(bar * 5 + i) * 1.2, duration:i === 3 ? 1.6 : .8});
    }));
    for (let i = 0; i < hour; i++) notes.push({midi:52, start:25 + i * 4.5, duration:2});
    return {id:'bigben', title:'ビッグベンの時報', notes, duration:notes[notes.length-1].start + 4.8, keyboardRange:[52,69]};
  }

  function play(context, output, music, onEnd) {
    const voices = new Set();
    const bus = context.createGain();
    bus.connect(output);
    const start = context.currentTime + .06;
    let cancelled = false;
    function stop() {
      if (cancelled) return;
      cancelled = true;
      bus.disconnect();
      for (const voice of voices) voice.stop();
    }
    try {
      for (const note of music.notes) {
        const pitch = 440 * 2 ** ((note.midi - 69) / 12);
        const at = start + note.start;
        for (const [ratio, level, decay] of note.midi === 52 ? greatBell : melody) {
          const voice = context.createOscillator(), gain = context.createGain();
          voice.frequency.value = pitch * ratio;
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(level, at + .012);
          gain.gain.exponentialRampToValueAtTime(.00005, at + decay);
          voice.connect(gain); gain.connect(bus);
          voices.add(voice);
          voice.onended = () => {
            voice.disconnect(); gain.disconnect(); voices.delete(voice);
            if (!voices.size && !cancelled) { bus.disconnect(); onEnd(); }
          };
          voice.start(at); voice.stop(at + decay + .02);
        }
      }
    } catch (e) { stop(); throw e; }
    return stop;
  }
  return {score, play};
}));
