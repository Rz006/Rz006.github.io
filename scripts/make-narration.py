# Turns scripts/narration.json into voiced clips:
#   assets/audio/<id>.mp3      the voiceover (Microsoft neural voice "Andrew", same as the TikTok videos)
#   assets/clip-data.js        clip text, word timings for captions, and duration
# Run:  python scripts/make-narration.py        (needs: pip install edge-tts)
import asyncio, json, pathlib
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE, RATE = 'en-US-AndrewNeural', '+8%'

async def voice(cid, clip):
    words, audio = [], bytearray()
    comm = edge_tts.Communicate(clip['text'], VOICE, rate=RATE, boundary='WordBoundary')
    async for ch in comm.stream():
        if ch['type'] == 'audio':
            audio += ch['data']
        elif ch['type'] == 'WordBoundary':
            words.append([round(ch['offset'] / 1e7, 3), round(ch['duration'] / 1e7, 3), ch['text']])
    (ROOT / 'assets' / 'audio' / f'{cid}.mp3').write_bytes(audio)
    return words

async def main():
    clips = json.loads((ROOT / 'scripts' / 'narration.json').read_text(encoding='utf-8'))
    (ROOT / 'assets' / 'audio').mkdir(parents=True, exist_ok=True)
    out = {}
    for cid, clip in clips.items():
        words = await voice(cid, clip)
        dur = round(words[-1][0] + words[-1][1] + 0.9, 2)
        out[cid] = {**clip, 'words': words, 'dur': dur}
        print(f'{cid:16s} {dur:5.1f}s  {len(words)} words')
    js = 'window.CLIP_DATA = ' + json.dumps(out, ensure_ascii=False) + ';\n'
    (ROOT / 'assets' / 'clip-data.js').write_text(js, encoding='utf-8')

asyncio.run(main())
