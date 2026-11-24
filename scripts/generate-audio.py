import math
import os
import random
import struct
import wave

BASE = os.path.join(os.getcwd(), "public", "audio")
CALLS = os.path.join(BASE, "calls")
os.makedirs(CALLS, exist_ok=True)

SR = 22050


def write_wav(path, samples):
    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        clamped = [max(-32767, min(32767, int(s * 32767))) for s in samples]
        wf.writeframes(struct.pack("<" + "h" * len(clamped), *clamped))


def env_ad(t, dur, a=0.05, r=0.15):
    if t < a:
        return t / max(a, 1e-4)
    if t > dur - r:
        return max(0.0, (dur - t) / max(r, 1e-4))
    return 1.0


def gen_ambient_rainforest():
    dur = 8.0
    n = int(SR * dur)
    rng = random.Random(42)
    lp = 0.0
    bp = 0.0
    samples = []
    chirp_times = [0.6, 1.9, 3.1, 4.7, 6.2, 7.1]
    for i in range(n):
        t = i / SR
        # Gentle rustling breeze via smoothed pink-ish noise
        white = rng.uniform(-1, 1)
        lp = lp * 0.965 + white * 0.035
        bp = bp * 0.88 + (white - lp) * 0.05
        wind = (lp * 0.25 + bp * 0.12) * (0.65 + 0.35 * math.sin(2 * math.pi * t / dur))

        # Soft tropical pad chord
        pad = 0.025 * (
            math.sin(2 * math.pi * 220 * t)
            + 0.6 * math.sin(2 * math.pi * 329.6 * t)
            + 0.4 * math.sin(2 * math.pi * 440 * t)
        ) * (0.7 + 0.3 * math.sin(2 * math.pi * 2 * t / dur))

        # Periodic distant tropical birds
        bird = 0.0
        for idx, ct in enumerate(chirp_times):
            dt = t - ct
            if 0 <= dt <= 0.24:
                base_f = 1650 + (idx % 3) * 320
                freq = base_f + 420 * math.sin(dt * 38)
                bird += 0.14 * env_ad(dt, 0.24, 0.02, 0.08) * math.sin(2 * math.pi * freq * dt)

        samples.append(max(-0.9, min(0.9, wind + pad + bird)))
    write_wav(os.path.join(BASE, "ambient-rainforest.wav"), samples)


def gen_ambient_river():
    dur = 6.0
    n = int(SR * dur)
    rng = random.Random(99)
    lp1, lp2 = 0.0, 0.0
    samples = []
    for i in range(n):
        t = i / SR
        w = rng.uniform(-1, 1)
        lp1 = lp1 * 0.92 + w * 0.08
        lp2 = lp2 * 0.78 + w * 0.22
        bubble = 0.04 * math.sin(2 * math.pi * (420 + 180 * math.sin(7 * t)) * t) * max(0, math.sin(13 * t))
        flow = (lp1 * 0.32 + (lp2 - lp1) * 0.16 + bubble) * (0.85 + 0.15 * math.sin(2 * math.pi * t / dur))
        samples.append(max(-0.9, min(0.9, flow)))
    write_wav(os.path.join(BASE, "ambient-river.wav"), samples)


def gen_tone_seq(notes, note_dur=0.14, wave_type="sine", vol=0.35):
    samples = []
    for freq in notes:
        m = int(SR * note_dur)
        for i in range(m):
            t = i / SR
            if wave_type == "tri":
                phase = (freq * t) % 1.0
                val = 4 * abs(phase - 0.5) - 1
            else:
                val = math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(4 * math.pi * freq * t)
            samples.append(vol * env_ad(t, note_dur, 0.015, 0.05) * val)
    return samples


def gen_sfx():
    write_wav(os.path.join(BASE, "sfx-discover.wav"), gen_tone_seq([523.25, 659.25, 783.99, 1046.5], 0.11, "sine", 0.32))
    write_wav(os.path.join(BASE, "sfx-correct.wav"), gen_tone_seq([587.33, 739.99, 880.0], 0.12, "sine", 0.35))
    write_wav(os.path.join(BASE, "sfx-wrong.wav"), gen_tone_seq([311.13, 246.94], 0.18, "tri", 0.26))
    write_wav(os.path.join(BASE, "sfx-badge.wav"), gen_tone_seq([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.13, "sine", 0.35))


def gen_calls():
    rng = random.Random(7)
    # Jaguar low growl
    jag = []
    for i in range(int(SR * 1.4)):
        t = i / SR
        noise = rng.uniform(-1, 1) * 0.18
        growl = math.sin(2 * math.pi * (88 - 22 * t) * t) + 0.5 * math.sin(2 * math.pi * 132 * t)
        jag.append(0.35 * env_ad(t, 1.4, 0.1, 0.4) * (growl * 0.7 + noise))
    write_wav(os.path.join(CALLS, "jaguar.wav"), jag)

    # Toucan playful double croak
    tou = []
    for i in range(int(SR * 1.1)):
        t = i / SR
        gate = 1.0 if (0.05 < t < 0.35 or 0.55 < t < 0.9) else 0.0
        val = math.sin(2 * math.pi * (620 - 160 * (t % 0.4)) * t) + 0.4 * math.sin(2 * math.pi * 1240 * t)
        tou.append(0.32 * gate * val)
    write_wav(os.path.join(CALLS, "toucan.wav"), tou)

    # Macaw bright squawk
    mac = []
    for i in range(int(SR * 1.2)):
        t = i / SR
        gate = 1.0 if (0.05 < t < 0.45 or 0.6 < t < 1.05) else 0.0
        f = 920 + 280 * math.sin(24 * t)
        val = math.sin(2 * math.pi * f * t) + 0.45 * math.sin(2 * math.pi * f * 1.5 * t)
        mac.append(0.28 * gate * val)
    write_wav(os.path.join(CALLS, "macaw.wav"), mac)

    # Poison dart frog bubbly trill
    frog = []
    for i in range(int(SR * 1.1)):
        t = i / SR
        pulse = max(0.0, math.sin(2 * math.pi * 7.5 * t))
        val = math.sin(2 * math.pi * (1450 + 220 * math.sin(18 * t)) * t)
        frog.append(0.28 * env_ad(t, 1.1, 0.05, 0.15) * pulse * val)
    write_wav(os.path.join(CALLS, "poison-dart-frog.wav"), frog)

    # Capybara soft whistle/chirp
    capy = gen_tone_seq([880, 988, 784], 0.16, "sine", 0.28)
    write_wav(os.path.join(CALLS, "capybara.wav"), capy)

    # Sloth gentle soft whistle
    sloth = gen_tone_seq([520, 610, 560], 0.28, "sine", 0.25)
    write_wav(os.path.join(CALLS, "sloth.wav"), sloth)

    # Anaconda gentle water splash/hiss
    ana = []
    lp = 0.0
    for i in range(int(SR * 1.2)):
        t = i / SR
        w = rng.uniform(-1, 1)
        lp = lp * 0.65 + w * 0.35
        ana.append(0.26 * env_ad(t, 1.2, 0.1, 0.3) * lp)
    write_wav(os.path.join(CALLS, "anaconda.wav"), ana)

    # Tapir high whistle
    tapir = gen_tone_seq([1180, 1340], 0.22, "sine", 0.26)
    write_wav(os.path.join(CALLS, "tapir.wav"), tapir)

    # Gentle plant sparkle chime
    plant = gen_tone_seq([523.25, 659.25, 783.99, 987.77, 1046.5], 0.15, "sine", 0.26)
    write_wav(os.path.join(CALLS, "plant-chime.wav"), plant)


if __name__ == "__main__":
    gen_ambient_rainforest()
    gen_ambient_river()
    gen_sfx()
    gen_calls()
    print("Generated synthesized Amazon audio WAV files.")
