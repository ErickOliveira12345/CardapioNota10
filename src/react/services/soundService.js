export async function playNewOrderSound() {
  try {
    const context = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = 850;

    oscillator.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(
      0.15,
      context.currentTime
    );

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.18
    );
  } catch (error) {
    console.warn(error);
  }
}