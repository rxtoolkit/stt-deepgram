# @rxtk/stt-deepgram
> 👂 An RxJS operator for real-time speech-to-text (STT/S2T) streaming using the Deepgram speech-to-text API.

```bash
npm i @rxtk/stt-deepgram
```

```bash
yarn add @rxtk/stt-deepgram
```

⚠️ To run the Deepgram transcription pipeline, you will need to provide a deepgram username and password.

⚠️ node.js only. This has not been tested on Browsers but it might be possible to make it work.  If you get it working, please make a PR!

## Demo
Create a .env file with your `DEEPGRAM_PASSWORD` and `DEEPGRAM_USERNAME`:
```bash
echo 'DEEPGRAM_PASSWORD=MYPASSWORD' >> .env
echo 'DEEPGRAM_USERNAME=MYUSERNAME' >> .env
```

Run the demo!
```bash
yarn build # you must build the code before running the demo
yarn demo run
```

## API

### `toDeepgram`
Stream audio speech data to transcription service via WebSocket and get transcripts back:
```js
import {map} from 'rxjs/operators';
import {toDeepgram} from '@rxtk/stt-deepgram';

// The pipeline can take a stream of audio chunks encoded as 
// LINEAR16 (PCM encoded as 16-bit integers) in the form of a Buffer
const buffer$ = pcmChunkEncodedAs16BitIntegers$.pipe(
  map(chunk => Buffer.from(chunk, 'base64')),
  toDeepgram({
    username: process.env.DEEPGRAM_USERNAME,
    password: process.env.DEEPGRAM_PASSWORD,
  })
);
buffer$.subscribe(console.log); // log transcript output
```

> ⚠️ Pay attention to the endcoding of the audio data.  The operator only accepts PCM data encoded as 16-bit integers. For example, LINEAR16 encoding usually works.

## Guides
- [Introduction to audio data](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Audio_concepts)
