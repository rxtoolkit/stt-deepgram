// Example usage:
// deepgram: DEEPGRAM_USERNAME=me@gmail.com DEEPGRAM_PASSWORD=seeecret yarn demo:run
// aws: AWS_ACCESS_KEY_ID=*** AWS_SECRET_ACCESS_KEY=*** yarn demo:run
// gcp: GOOGLE_APPLICATION_CREDENTIAL=path/to/credentials demo:run
// for deepspeech, the model must be installed locally! then:
// deepspeech: demo:run
const {Command} = require('commander');
const path = require('path');
const {DateTime} = require('luxon');

const {concat, of, throwError} = require('rxjs');
const {map, scan, share,tap} = require('rxjs/operators');

const {fromFile,writeFile} = require('@bottlenose/rxfs');
const {toDeepgram} = require('../dist/index.js');

const trace = label => tap(data => console.log(label, data));

const transcribe = params => {
  const audioChunk$ = fromFile({filePath: params.inputFilePath});
  const transcription$ = audioChunk$.pipe(
    toDeepgram(params)
  );
  return transcription$;
};

const dateFormat = 'YYYY-MM-DD-hh-mm-ss';

const outputWriter = filePath => message$ => {
  const rawJsonStr$ = message$.pipe(
    scan(([index], message) => [index + 1, message], [-1, null]),
    map(([index, message]) => ({index, ...message})),
    map(message => JSON.stringify(message)),
    share()
  );
  // add commas to all but the last json object
  const allButLastJsonStr$ = rawJsonStr$.pipe(
    // skipLast(1),
    map(json => `${json},`)
  );
  // const lastJsonStr$ = rawJsonStr$.pipe(takeLast(1));
  // const json$ = merge(allButLastJsonStr$, lastJsonStr$);
  const json$ = allButLastJsonStr$;
  const fileContentObservables = [
    of('['), // starting character
    json$, // JSON objects
    of(']'), // ending character
  ];
  const outputWriter$ = concat(...fileContentObservables).pipe(
    trace('outputToWrite'),
    map(str => Buffer.from(str)),
    trace('bufferToWrite'),
    writeFile({filePath}),
    trace('writeResult')
  );
  return outputWriter$;
};

function runDemo(...args) {
  const params = args[0];
  console.log('Running transcription pipeline...');
  console.log('params', params);
  const transcription$ = transcribe(params).pipe(share());
  transcription$.subscribe(
    out => console.log(JSON.stringify(out)),
    console.trace,
    () => {
      console.log('DONE');
      if (!params.writeOutput) process.exit();
    }
  );
  if (params.writeOutput) {
    const outputWriter$ = transcription$.pipe(outputWriter(params.outputPath));
    outputWriter$.subscribe(null, console.trace, () => 1);
  }
};

const program = new Command();

const defaults = {
  outputPath: path.resolve(__dirname, `./output/${DateTime.local().toFormat(dateFormat)}.json`),
  inputFilePath: path.resolve(__dirname, './sample-audio.linear16'),
};

program
  .command('run')
  .description('Runs transcription demo. Example: run')
  .option(
    '--input-file-path <inputFilePath>',
    'Path to input audio file',
    defaults.inputFilePath
  )
  .option(
    '--write-output',
    'write output to a file at the given path',
    defaults.outputPath
  )
  .option(
    '--output-path <outputPath>',
    'Path of where to write output',
    defaults.outputPath
  )
  .option(
    '--username <username>',
    'Deepgram username',
    process.env.DEEPGRAM_USERNAME
  )
  .option(
    '--password <password>',
    'Deepgram password',
    process.env.DEEPGRAM_PASSWORD
  )

  .action(options => runDemo({...options}))

program.parse(process.argv);
